import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTimer } from '@/context/TimerContext';
import { SignOutButton } from './SignOutButton';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

const SCREENS = [
  { name: 'Timer', route: '/' as const, icon: 'house.fill' as const },
  { name: 'Adopt Cats', route: '/adopt' as const, icon: 'paperplane.fill' as const },
  { name: 'Purrdex', route: '/purrdex' as const, icon: 'person.fill' as const },
] as const;

export function ScreenDropdown() {
  const { isTimerActive } = useTimer();
  if (isTimerActive) return null;
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}>
        <IconSymbol
          name="line.3.horizontal"
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          {SCREENS.map((screen) => (
            <TouchableOpacity
              key={screen.route}
              style={styles.option}
              onPress={() => {
                router.push(screen.route);
                setIsOpen(false);
              }}>
              <IconSymbol name={screen.icon} size={20} color="#fff" />
              <ThemedText style={styles.optionText}>{screen.name}</ThemedText>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          <SignOutButton onSignOut={() => setIsOpen(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    width: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.71)',
    backdropFilter: 'blur(10px)',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 6,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 4,
  },
}); 