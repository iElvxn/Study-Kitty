import { ScreenDropdown } from '@/components/ScreenDropdown';
import { TimerProvider } from '@/context/TimerContext';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { initializeUser } from '../aws/users';

export default function AuthRoutesLayout() {
  const { isSignedIn, getToken } = useAuth();
  const hasInitalizedUser = useRef(false);

  useEffect(() => {
    const initializeUserAfterAuth = async () => {
      if (!isSignedIn || hasInitalizedUser.current) return;

      try {
        const token = await getToken();
        if (token) {
          await initializeUser(token);
          console.log("User initialized");
          hasInitalizedUser.current = true;
        } else {
          console.log('No token yet');
        }
      } catch (error) {
        console.error('Error creating user data:', error);
      }
    };

    initializeUserAfterAuth();
  }, [isSignedIn]);

  if (!isSignedIn) {
    return <Redirect href="/(auth)/index" />;
  }

  return (
    <TimerProvider>
      <ScreenDropdown />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </TimerProvider>
  );
}
