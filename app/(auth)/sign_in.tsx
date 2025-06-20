import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth, useSignIn, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createUserData } from '../../app/aws/users';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut, getToken, userId } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  WebBrowser.maybeCompleteAuthSession()

  const { startSSOFlow } = useSSO()

  const handleSignInWithSSO = useCallback(async (authStrategy: string) => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: authStrategy as any, // Type assertion to fix linter error
        redirectUrl: AuthSession.makeRedirectUri(),
      })

      if (createdSessionId) {
        setActive!({ session: createdSessionId })
        // Create user data after successful SSO authentication
        await createUserAfterAuth();
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }, [])

  const createUserAfterAuth = async () => {
    try {
      const token = await getToken();
      if (token && userId) {
        await createUserData(token, userId);
      }
    } catch (error) {
      console.error('Error creating user data:', error);
      // Don't block the user flow if user creation fails
    }
  };

  // Reset any existing session when mounting the sign-in screen
  React.useEffect(() => {
    const resetSession = async () => {
      try {
        await signOut();
      } catch (err) {
      }
    };
    resetSession();
    void WebBrowser.warmUpAsync()
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync()
    }
  }, []);

  const handleSignUpPress = async () => {
    try {
      await signOut();
    } catch (err) {
    }
    router.push('/(auth)/sign_up');
  };

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        
        // Create user data after successful authentication
        await createUserAfterAuth();
        
        router.replace('/(home)');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const handleBackPress = () => {
    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress}>
            <IconSymbol name="chevron.left" size={24} color="#000"/>
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#000' , fontSize: 38, fontWeight: '700', textAlign: 'left', fontFamily: 'Poppins-Bold'}]}>Lets Sign You In</Text>
          <Text style={[styles.title, { color: '#000' , fontSize: 28, fontWeight: '400', textAlign: 'left', fontFamily: 'Poppins-Regular'}]}>Return to your cat cafe focus zone
          </Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email"
          placeholderTextColor="#666"
          onChangeText={(email) => setEmailAddress(email)}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={password}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            onChangeText={(pass) => setPassword(pass)}
          />
          <TouchableOpacity 
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <IconSymbol 
              name={showPassword ? "eye.slash" : "eye"} 
              size={20} 
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={onSignInPress}>
          <Text style={styles.continueButtonText}>Sign In with Email</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.socialButton} onPress={() => handleSignInWithSSO('apple')}>
          <IconSymbol name="apple.logo" size={20} color={Colors.text} />
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={() => handleSignInWithSSO('google')}>
          <IconSymbol name="g.circle" size={20} color={Colors.text} />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={handleSignUpPress}>
            <Text style={styles.linkText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C7B6F5',
  },
  topSection: {
    flex: .3,
    padding: 20,
  },
  bottomSection: {
    flex: .7,
    backgroundColor: '#000',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  socialButtonText: {
    color: Colors.text,
    fontSize: 16,
    marginLeft: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 10,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#C7B6F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#C7B6F5',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 50, // Make room for the eye icon
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});