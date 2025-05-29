import { ScreenDropdown } from '@/components/ScreenDropdown'
import { useAuth } from '@clerk/clerk-expo'
import { Redirect, Stack } from 'expo-router'
import React from 'react'

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return <Redirect href={'/(auth)/sign_up'} />
  }

  return (
    <>
      <ScreenDropdown />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </>
  )
}