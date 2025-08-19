import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AuthIndexScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.imageContainer}>
                    <Image 
                        source={require('@/assets/images/cat-cafe-banner.png')}
                        style={styles.logo}
                    />
                </View>
                
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Study Kitty</Text>
                    <Text style={styles.subtitle}>Your purr-fect study companion</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.button, styles.loginButton]} 
                        onPress={() => router.push('/(auth)/sign_in')}
                    >
                        <Text style={[styles.buttonText, styles.loginText]}>Login</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.button, styles.registerButton]} 
                        onPress={() => router.push('/(auth)/sign_up')}
                    >
                        <Text style={[styles.buttonText, styles.registerText]}>Register</Text>
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
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        maxWidth: 500,
        width: '100%',
        alignSelf: 'center',
    },
    imageContainer: {
        width: '100%',
        maxHeight: 400,
        flex: 1,
        maxWidth: 500,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 44,
        fontFamily: 'Quicksand_700Bold',
        color: '#000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 20,
        fontFamily: 'Quicksand_500Medium',
        color: '#000',
        opacity: 0.7,
        textAlign: 'center',
        marginTop: 4,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        paddingHorizontal: 20,
        marginTop: 'auto',
        paddingBottom: 20,
    },
    button: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    loginButton: {
        backgroundColor: '#000',
    },
    registerButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#000',
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
    },
    loginText: {
        color: '#fff',
    },
    registerText: {
        color: '#000',
    },
});
   