import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth, useSignUp, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signOut, getToken } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  const inputRefs = React.useRef<TextInput[]>([]);
  const [codeDigits, setCodeDigits] = React.useState(['', '', '', '', '', '']);

  // Reset any existing session when mounting the sign-up screen
  React.useEffect(() => {
    const resetSession = async () => {
      try {
        await signOut();
      } catch (err) {
      }
    };
    resetSession();
  }, []);

  WebBrowser.maybeCompleteAuthSession()

  const { startSSOFlow } = useSSO()

  const handleSignInWithSSO = useCallback(async (authStrategy: string) => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: `oauth_${authStrategy}`,
        redirectUrl: AuthSession.makeRedirectUri(),
      })

      if (createdSessionId) {
        setActive!({ session: createdSessionId })

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

  const handleSignInPress = async () => {
    try {
      // Try to clean up any existing session before navigating
      await signOut();
    } catch (err) {
      // Ignore errors - user might not be signed in
    }
    router.push('/(auth)/sign_in');
  };

  // Handle individual digit input
  const handleDigitChange = (text: string, index: number) => {
    if (text.length > 1) text = text[0]; // Only take first character if multiple entered

    const newCodeDigits = [...codeDigits];
    newCodeDigits[index] = text;
    setCodeDigits(newCodeDigits);
    setCode(newCodeDigits.join(''));

    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onResendPress = async () => {
    if (!isLoaded) return;
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
  };

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Clear any previous errors
    setError('');

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      //console.error(JSON.stringify(err, null, 2));
      if (err?.errors?.[0]?.code === 'form_identifier_exists') {
        setError('An account with this email already exists');
      } else if (err?.errors?.[0]?.code === 'form_password_length_too_short') {
        setError('Password must be at least 8 characters');
      } else if (err?.errors?.[0]?.code === 'form_password_pwned') {
        setError('This password has been compromised in a data breach. Please choose a different one.');
      } else if (err?.errors?.[0]?.code === 'form_param_nil' || err?.errors?.[0]?.code === 'form_conditional_param_missing') {
        setError('Please fill in all fields');
      } else if (err?.errors?.[0]?.code === 'form_password_validation_failed') {
        setError('Password does not meet requirements');
      } else if (err?.errors?.[0]?.code === 'form_param_format_invalid') {
        setError('Email is invalid');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(home)');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      if (err?.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Incorrect verification code');
      } else if (err?.errors?.[0]?.code === 'form_code_expired') {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  const handleBackPress = () => {
    router.back();
  }

  if (pendingVerification) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.topSection}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackPress}>
                <IconSymbol name="chevron.left" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.verifyTitle, { color: '#000' }]}>Verification</Text>
            <Text style={[styles.verifySubtitle, { color: '#666' }]}>
              We sent you an Email{'\n'}with a 6-digit code
            </Text>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.codeInputContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) {
                      inputRefs.current[index] = ref;
                    }
                  }}
                  style={styles.codeInput}
                  value={codeDigits[index]}
                  onChangeText={(text) => handleDigitChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  placeholder="0"
                  placeholderTextColor="#666"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                { opacity: code.length === 6 ? 1 : 0.5 }
              ]}
              onPress={onVerifyPress}
              disabled={code.length !== 6}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <IconSymbol name="arrow.right" size={20} color="#000" style={styles.buttonIcon} />
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive a code?</Text>
              <TouchableOpacity onPress={onResendPress}>
                <Text style={styles.resendButton}>Resend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress}>
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#000', fontSize: 38, fontWeight: '700', textAlign: 'left', fontFamily: 'Poppins-Bold' }]}>Get Started</Text>
          <Text style={[styles.title, { color: '#000', fontSize: 28, fontWeight: '400', textAlign: 'left', fontFamily: 'Poppins-Regular' }]}>Enter distraction-free focus in the cat cafe</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.inputContainer}>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email"
            placeholderTextColor="#666"
            onChangeText={(email) => setEmailAddress(email)}
            style={styles.input}
          />
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            value={password}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            onChangeText={(pass) => setPassword(pass)}
            style={[styles.input, styles.passwordInput]}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <IconSymbol name={showPassword ? 'eye.slash' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.continueButton} onPress={onSignUpPress}>
          <Text style={styles.continueButtonText}>Continue with Email</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.socialButton} onPress={() => handleSignInWithSSO('apple')}>
          <IconSymbol name="apple.logo" size={20} color={'#FFF'} />
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={() => handleSignInWithSSO('google')}>
          <IconSymbol name="g.circle" size={20} color={'#FFF'} />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleSignInPress}>
            <Text style={styles.linkText}>Login</Text>
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
    color: '#FFF',
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
    color: '#FFF',
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
  verifyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  verifySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  codeInput: {
    width: 45,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 24,
    textAlign: 'center',
    color: '#FFF',
    backgroundColor: 'transparent',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    color: '#C7B6F5',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
}); 
