import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// @ts-ignore
import BackgroundTimer from 'react-native-background-timer';

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
  const [awayStartTime, setAwayStartTime] = useState<number | null>(null);
  const [wasAwayTooLong, setWasAwayTooLong] = useState(false);

  // Handle app state changes for away detection and timer completion
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground
        if (awayStartTime && isActive) {
          const timeAway = Date.now() - awayStartTime;
          const secondsAway = Math.floor(timeAway / 1000);

          if (secondsAway > AWAY_TIME_LIMIT) {
            setWasAwayTooLong(true);

            // Stop the timer immediately
            BackgroundTimer.stop();
            setIsActive(false);
            setTime(initialTime);
          }
        }
        setAwayStartTime(null);

        // Handle timer completion when returning from background
        if (isActive && time === 0) {
          if (!wasAwayTooLong) {
            onComplete?.();
          }
          setIsActive(false);
          setTime(initialTime);
          setWasAwayTooLong(false);
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background
        if (isActive) {
          setAwayStartTime(Date.now());
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isActive, awayStartTime, initialTime, time, onComplete, wasAwayTooLong]);

  // Handle timer countdown
  useEffect(() => {
    let interval: number;

    //count down the seconds using background timer
    if (isActive && time > 0) {
      BackgroundTimer.start();
      interval = BackgroundTimer.setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && time === 0) {
      // Timer completed!
      BackgroundTimer.stop();

      // Only call onComplete if user wasn't away too long
      if (!wasAwayTooLong) {
        onComplete?.();
      }

      setIsActive(false);
      setTime(initialTime);
      setWasAwayTooLong(false); // Reset for next session
    } else {
      BackgroundTimer.stop();
      setIsActive(false);
      setTime(initialTime);
    }

    // Notify parent component of state change
    onStateChange?.(isActive);

    return () => {
      if (interval) {
        BackgroundTimer.clearInterval(interval);
        BackgroundTimer.stop();
      }
    };
  }, [isActive, time, initialTime, onStateChange, onComplete, wasAwayTooLong]);

  // Notify parent when session time changes
  useEffect(() => {
    onSessionTimeChange?.(initialTime);
  }, [initialTime, onSessionTimeChange]);

  const toggleTimer = () => {
    setIsActive(!isActive);
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
              <Text style={styles.closeButtonText}>Yay!</Text>
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
          onPress={toggleTimer}
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