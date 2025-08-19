import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';

// Define primary color from the theme
const primaryColor = Colors.tint;

const { width, height } = Dimensions.get('window');

const tutorialSteps = [
    {
        title: 'Welcome to Study Kitty!',
        description: 'A purr-fect companion for your study sessions',
        image: require('../../assets/images/cat-cafe-banner.png'),
    },
    {
        title: 'Start a Study Session',
        description: 'Use the slider to set your timer to track your focused study time! Earn coins for every minute you study.',
        image: require('../../assets/images/timerslider.webp'),
    },
    {
        title: 'Hard Mode',
        description: 'Set hard mode to prevent distractions! If you leave the app, then your session will end. Activate it in settings.',
        image: require('../../assets/images/sessionstopped.webp'),
    },
    {
        title: 'Adopt Cats',
        description: 'Adopt cats with coins. Cats that you own will appear in the cafe!',
        image: require('../../assets/images/adopted.webp'),
    },
    {
        title: 'Upgrade Your Cafe',
        description: 'Spend coins to buy furniture and decorations to bring in more cats!',
        image: require('../../assets/images/cattree.webp'),
    },
    {
        title: 'Tags',
        description: 'Tags are used to categorize your study sessions. You can use them to track your productivity!',
        image: require('../../assets/images/tags.webp'),
    },
    {
        title: 'Statistics',
        description: 'Statistics show you how much time you have spent studying and how many cats you have adopted!',
        image: require('../../assets/images/stats.webp'),
    },
    {
        title: 'Streaks',
        description: 'Streaks show you how many days you have been studying in a row! You get a 10% boost in coins per day!',
        image: require('../../assets/images/streak.jpg'),
    },
    {
        title: 'Pro',
        description: 'Pro is a subscription that gives you access to all features of the app!',
        image: require('../../assets/images/cat-cafe-banner.png'),
    },
];

export default function TutorialScreen() {
    const [currentStep, setCurrentStep] = useState(0);
    const router = useRouter();

    const nextStep = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            router.back();
        }
    };

    const skipTutorial = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Tutorial',
                    headerShown: false
                }}
            />

            <View style={styles.stepContainer}>
                <Text style={styles.title}>{tutorialSteps[currentStep].title}</Text>
                <View style={styles.imageContainer}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={tutorialSteps[currentStep].image}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>
                </View>
                <Text style={styles.description}>{tutorialSteps[currentStep].description}</Text>
            </View>

            <View style={styles.dotsContainer}>
                {tutorialSteps.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === currentStep ? styles.activeDot : {}
                        ]}
                    />
                ))}
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={skipTutorial} style={styles.skipButton}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextStep} style={styles.nextButton}>
                    <Text style={styles.nextButtonText}>
                        {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#C7B6F5',
        padding: 20,
        justifyContent: 'space-between',
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 30,
        color: "#000",
        textAlign: 'center',
        fontFamily: 'Quicksand_700Bold',
    },
    description: {
        fontSize: 24,
        textAlign: 'center',
        marginTop: 30,
        color: '#000',
        lineHeight: 24,
        fontFamily: 'Quicksand_700Bold',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageWrapper: {
        flex: 1,
        borderRadius: 15,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 250,
        borderRadius: 15,
        backgroundColor: 'transparent',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 20,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ddd',
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: primaryColor,
        width: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    skipButton: {
        padding: 15,
    },
    skipButtonText: {
        color: '#666',
        fontSize: 16,
    },
    nextButton: {
        backgroundColor: primaryColor,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        minWidth: 150,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
