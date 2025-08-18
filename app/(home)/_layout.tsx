import { ScreenDropdown } from '@/components/ScreenDropdown';
import { TimerProvider } from '@/context/TimerContext';
import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { Redirect, Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, ViewStyle } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { initializeUser } from '../aws/users';

const contentStyle: ViewStyle = {
  flex: 1,
  backgroundColor: 'transparent',
};


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

  //for pro
  useEffect(() => {
    const initializePurchases = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.ERROR);

        if (Platform.OS === 'ios') {
          Purchases.configure({
            apiKey: "appl_MXGKbHagpEJVmmLaHEPltAQJcPz"
          });
        }
        
        await getCustomerInfo();
        clearImageCache();
      } catch (error) {
        console.error('Error initializing purchases:', error);
      }
    };

    initializePurchases();
  }, []);

  const getCustomerInfo = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      // console.log("customerInfo", JSON.stringify(customerInfo, null, 2));
    } catch (error) {
      console.error('Error getting customer info:', error);
    }
  }

  const clearImageCache = () => {
    console.log("Clearing image cache");
    Image.clearMemoryCache();
    Image.clearDiskCache();
  }


  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <TimerProvider>
      <ScreenDropdown />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          // Optimize memory usage for native stack
          animationTypeForReplace: 'push',
          contentStyle: contentStyle,
        }}
        screenListeners={{
          // Clear image cache when screen changes
          state: () => ({
            transitionEnd: () => {
              if (Platform.OS !== 'web') {
                // Clear memory cache after a short delay to ensure smooth transitions
                setTimeout(() => {
                  Image.clearMemoryCache();
                }, 300);
              }
            },
          }),
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{
            // Optimize home screen
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="upgrade" 
          options={{
            // Optimize upgrade screen
            animation: 'slide_from_right',
            // Clear cache when leaving this screen
            contentStyle: [contentStyle, { backgroundColor: '#1E1E1E' }],
          }} 
        />
      </Stack>
    </TimerProvider>
  );
}
