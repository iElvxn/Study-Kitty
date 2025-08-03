import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSignIn } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { isLoaded, signIn, setActive } = useSignIn()
  
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleResetPassword = async () => {
    if (!isLoaded) return;
    
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!code) {
      setError('Verification code is required');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Attempt to reset the password
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. You can now sign in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/sign_in'),
            },
          ]
        );
      } else {
        console.error(JSON.stringify(result, null, 2));
        setError('An error occurred while resetting your password');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Handle different error formats
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err?.errors?.[0]?.message) {
        errorMessage = err.errors[0].message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      
      setCodeSent(true);
      Alert.alert('Success', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>
            Reset Password
          </Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to {email} and set a new password.
          </Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.inputContainer}>
          <TextInput
            value={code}
            placeholder="Verification Code"
            onChangeText={setCode}
            style={styles.input}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            value={newPassword}
            placeholder="New Password"
            secureTextEntry={!showPassword}
            onChangeText={setNewPassword}
            style={[styles.input, styles.passwordInput]}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
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

        <View style={styles.passwordContainer}>
          <TextInput
            value={confirmPassword}
            placeholder="Confirm New Password"
            secureTextEntry={!showConfirmPassword}
            onChangeText={setConfirmPassword}
            style={[styles.input, styles.passwordInput]}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <IconSymbol
              name={showConfirmPassword ? "eye.slash" : "eye"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.continueButton, isLoading && styles.disabledButton]} 
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.continueButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive a code? </Text>
          <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
            <Text style={styles.resendLink}>Resend Code</Text>
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
    flex: 0.3,
    padding: 20,
  },
  bottomSection: {
    flex: 0.7,
    backgroundColor: '#000',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
  },
  header: {
    marginTop: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 400,
    marginBottom: 24,
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingRight: 40,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
  },
  continueButton: {
    backgroundColor: '#C7B6F5',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  resendText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  resendLink: {
    color: '#C7B6F5',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
});
