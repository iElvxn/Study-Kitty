import { Colors } from '@/constants/Colors'
import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { clearUserCache } from '../app/aws/users'
import { ThemedText } from './ThemedText'
import { IconSymbol } from './ui/IconSymbol'

type SignOutButtonProps = {
  onSignOut?: () => void;
}

export const SignOutButton = ({ onSignOut }: SignOutButtonProps) => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    try {
      await clearUserCache()
      await signOut()
      onSignOut?.()
      // Redirect to your desired page
      console.log('signing out')
      Linking.openURL(Linking.createURL('/(auth)'))
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <TouchableOpacity style={styles.option} onPress={handleSignOut}>
      <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={Colors.text} />
      <ThemedText>Sign Out</ThemedText>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 6,
  },
})