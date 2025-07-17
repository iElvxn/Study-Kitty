import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FocusTimerProps {
  onStateChange?: (isActive: boolean) => void;
  onSessionTimeChange?: (sessionTime: number) => void;
  onComplete?: () => void;
}

export default function FocusTimer({ onStateChange, onSessionTimeChange, onComplete }: FocusTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);

  useEffect(() => {
    let interval: number;

    //count down the seconds
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && time === 0) {
      // Timer completed!
      onComplete?.(); // Call the callback
      setIsActive(false);
      setTime(initialTime);
    } else {
      setIsActive(false);
      setTime(initialTime);
    }

    // Notify parent component of state change
    onStateChange?.(isActive);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, time, initialTime, onStateChange, onComplete]);

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
          maximumValue={120 * 60}
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
}); 