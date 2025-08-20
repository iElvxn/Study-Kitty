import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getSettings } from '../settings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface FocusTimerProps {
  onStateChange?: (isActive: boolean) => void;
  onSessionTimeChange?: (sessionTime: number) => void;
  onComplete?: () => void;
}

export default function FocusTimer({ onStateChange, onSessionTimeChange, onComplete }: FocusTimerProps) {
  const AWAY_TIME_LIMIT = 5; // seconds
  const DEFAULT_TIMER_TIME = 25 * 60; // seconds
  const MAX_TIMER_TIME = 120 * 60; // seconds

  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(DEFAULT_TIMER_TIME);
  const [initialTime, setInitialTime] = useState(DEFAULT_TIMER_TIME);
  const [wasAwayTooLong, setWasAwayTooLong] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>([]);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);

  // Use refs to avoid stale closure issues
  const isActiveRef = useRef(isActive);
  const hasProcessedCompletionRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onStateChangeRef = useRef(onStateChange);
  const onSessionTimeChangeRef = useRef(onSessionTimeChange);

  // Keep refs updated
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onStateChangeRef.current = onStateChange;
    onSessionTimeChangeRef.current = onSessionTimeChange;
  }, [onComplete, onStateChange, onSessionTimeChange]);

  useEffect(() => {
    console.log("test")
    registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
    }
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => { //if app refreshes?
    const loadOldTimer = async () => {
      await renderOldTimer();
    }
    loadOldTimer();
  }, []);

  // Handle app state changes for away detection and timer completion
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      const settings = await getSettings();
      
      if (nextAppState === 'active') {
        // App came to foreground
        let shouldStopTimer = false;
        
        if (isActiveRef.current) {
          const savedAwayStartTime = await AsyncStorage.getItem('awayStartTime');
          if (savedAwayStartTime) {
            const awayStartTime = parseInt(savedAwayStartTime, 10);
            const timeAway = Date.now() - awayStartTime;
            const secondsAway = Math.floor(timeAway / 1000);
            console.log("secondsAway", secondsAway);
            
            if (settings.hardMode && secondsAway > AWAY_TIME_LIMIT) {
              shouldStopTimer = true;
              setWasAwayTooLong(true);
              await stopTimer();
            }
            // Remove the away start time after we've checked it
            await AsyncStorage.removeItem('awayStartTime');
          }
        }
        
        // Only render old timer if we didn't just stop it for being away too long
        if (!shouldStopTimer) {
          await renderOldTimer();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background - just update the away start time
        if (isActiveRef.current) {
          await AsyncStorage.setItem('awayStartTime', Date.now().toString());
          console.log(new Date(Date.now()).toISOString())
        }
      }
    };
    
    // Initial state check
    const init = async () => {
      const currentState = AppState.currentState;
      if (currentState === 'active') {
        await renderOldTimer();
      }
    };
    
    init();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, []); // Empty dependencies - use refs to avoid stale closures

  // Handle timer countdown
  useEffect(() => {
    let interval: number | null = null;
    let mounted = true;

    const tick = async () => {
      if (mounted) {
        setTime(prev => {
          if (prev <= 1) {
            // Time's up
            if (interval) clearInterval(interval);
            if (!wasAwayTooLong) {
              onCompleteRef.current?.();
              stopTimer();
            }
            return 0;
          }
          return prev - 1;
        });
      }
    };

    if (isActive && time > 0) {
      interval = setInterval(tick, 1000);
    } else if (isActive && time === 0) {
      if (interval) clearInterval(interval);
      if (!wasAwayTooLong) {
        onCompleteRef.current?.();
      }

      setIsActive(false);
      setTime(initialTime);
      setWasAwayTooLong(false);
    } else if (interval) {
      clearInterval(interval);
    }

    // Notify parent component of state change using ref
    onStateChangeRef.current?.(isActive);

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, wasAwayTooLong]); // Removed time and initialTime from deps

  // Notify parent when session time changes
  useEffect(() => {
    onSessionTimeChangeRef.current?.(initialTime);
  }, [initialTime]);

  const startTimer = async () => {
    if (isActive) return; // Prevent multiple starts
    
    // Clean up any existing notifications and timer state
    console.log("canceling notification")
    await Notifications.cancelAllScheduledNotificationsAsync();
    hasProcessedCompletionRef.current = false;
    setIsActive(true);
    
    // Save the initial timer state
    const startTime = Date.now();
    const timerData = { startTime, duration: initialTime };
    await AsyncStorage.setItem('activeTimer', JSON.stringify(timerData));
    console.log('Started timer:', timerData);
    
    // Schedule new notification
    console.log("scheduling notification")
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's up! ⏰",
        body: "Your focus session has ended.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: initialTime, // Use the full duration for the notification
      },
    });
  };

  const stopTimer = async () => {
    console.log("Stopping timer and cleaning up");
    // Set ref first to prevent race conditions
    isActiveRef.current = false;
    // Then update state
    setIsActive(false);
    setTime(initialTime);
    hasProcessedCompletionRef.current = true; // Mark as processed to prevent completion
    
    try {
      await AsyncStorage.removeItem('activeTimer');
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error stopping timer:", error);
    } finally {
      // Ensure we're in a clean state
      isActiveRef.current = false;
    }

    console.log("Away for too long:", wasAwayTooLong)
  };

  const handleSliderChange = (value: number) => {
    setTime(value);
    if (!isActive) {
      setInitialTime(value);
    }
  };

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('myNotificationChannel', {
        name: 'A channel is needed for the permissions prompt to appear',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log(token);
      } catch (e) {
        token = `${e}`;
      }
    } else {
      alert('Must use physical device for Push Notifications');
    }

    return token;
  }

  const renderOldTimer = async () => {
    console.log("Checking for active timer...");
    
    if (hasProcessedCompletionRef.current) {
      console.log("Already processed completion, skipping");
      return;
    }
    
    try {
      const savedData = await AsyncStorage.getItem('activeTimer');
      console.log("Found saved timer data:", savedData);
      
      if (!savedData) {
        console.log("No active timer found");
        return;
      }
      
      const { startTime, duration } = JSON.parse(savedData);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      if (remaining > 0) {
        console.log(`Restoring timer: ${remaining}s remaining of ${duration}s session`);
        setInitialTime(duration);
        setTime(remaining);
        setIsActive(true);
        isActiveRef.current = true;
        
        // Only reschedule notification if there's still time left
        // await Notifications.scheduleNotificationAsync({
        //   content: {
        //     title: "Time's up! ⏰",
        //     body: "Your focus session has ended.",
        //     sound: true,
        //   },
        //   trigger: {
        //     type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        //     seconds: remaining,
        //   },
        // });
      } else {
        console.log("Timer completed while away, cleaning up");
        await cleanupTimerState(duration);
      }
  } catch (error) {
    console.error("Error in renderOldTimer:", error);
    await cleanupTimerState(initialTime);
  }
};
  
  const cleanupTimerState = async (duration: number) => {
    // Mark as processed FIRST to prevent re-entry
    hasProcessedCompletionRef.current = true;
    
    // Clean up storage and notifications
    await AsyncStorage.removeItem('activeTimer');
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Reset timer state
    setIsActive(false);
    isActiveRef.current = false;
    setTime(duration);
    setInitialTime(duration);
    
    // Notify completion on next tick
    setTimeout(() => {
      onCompleteRef.current?.();
    }, 0);
  };

  return (
    <>
      <Modal
        visible={wasAwayTooLong}
        transparent
        animationType="fade"
        onRequestClose={() => setWasAwayTooLong(false)}
        accessible
        accessibilityViewIsModal
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Session Stopped! 😿</Text>
            <Text style={styles.modalText}>You were away for too long during your study session. Try again and stay focused!</Text>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              onPress={() => setWasAwayTooLong(false)}
              accessibilityLabel="Close reward modal"
            >
              <Text style={styles.closeButtonText}>Okay</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <View style={styles.container}>
        <Text style={styles.timerText}>{formatTime()}</Text>
        {isActive ? (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${((initialTime - time) / initialTime) * 100}%` }
                ]}
              />
            </View>
          </View>
        )
          :
          (
            <Slider
              style={{ width: 225, height: 10 }}
              value={time}
              minimumValue={0}
              maximumValue={MAX_TIMER_TIME}
              step={60}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#F9E4BC"
              maximumTrackTintColor="rgba(249, 228, 188, 0.3)"
              thumbTintColor="#F9E4BC"
            />
          )}

        <TouchableOpacity
          style={[styles.button, isActive ? styles.stopButton : styles.startButton]}
          onPress={isActive ? stopTimer : startTimer}
        >
          <Text style={styles.buttonText}>
            {isActive ? 'Give Up' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 0,
    backgroundColor: 'rgba(46, 44, 44, 0.35)',
    borderRadius: 24,
  },
  timerText: {
    fontSize: 64,
    fontFamily: 'Quicksand_700Bold',
    color: '#F9E4BC',
    opacity: 0.9,
    textShadowColor: 'rgb(27, 18, 2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: 'rgba(90, 153, 93, 0.75)',
  },
  stopButton: {
    backgroundColor: 'rgba(177, 102, 102, 0.6)',
  },
  buttonText: {
    color: '#E6D5BC',
    fontSize: 17,
    fontFamily: 'Quicksand_500Medium',
    opacity: 0.9,
  },
  progressBarContainer: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBackground: {
    width: 225,
    height: 5,
    backgroundColor: 'rgba(230, 213, 188, 0.15)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E6D5BC',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    padding: 30,
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalText: {
    textAlign: "center",
    fontSize: 20,
    color: '#2D1810',
    marginBottom: 10,
    fontFamily: 'Quicksand_500Medium',
  },
  closeButton: {
    backgroundColor: '#B6917E',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF5E6',
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
  },
});