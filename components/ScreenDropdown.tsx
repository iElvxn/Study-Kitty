import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { SignOutButton } from './SignOutButton';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

const SCREENS = [
  { name: 'Home', route: '/' as const, icon: 'house.fill' as const },
  { name: 'Explore', route: '/explore' as const, icon: 'paperplane.fill' as const },
  { name: 'Profile', route: '/profile' as const, icon: 'person.fill' as const },
] as const;

export function ScreenDropdown() {
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
          color={Colors.text}
        />
      </TouchableOpacity>

      {isOpen && (
        <ThemedView style={styles.dropdown}>
          {SCREENS.map((screen) => (
            <TouchableOpacity
              key={screen.route}
              style={styles.option}
              onPress={() => {
                router.push(screen.route);
                setIsOpen(false);
              }}>
              <IconSymbol name={screen.icon} size={20} color={Colors.text} />
              <ThemedText>{screen.name}</ThemedText>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          <SignOutButton onSignOut={() => setIsOpen(false)} />
        </ThemedView>
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
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.icon,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    width: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.icon,
    padding: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.icon,
    marginVertical: 4,
  },
}); 