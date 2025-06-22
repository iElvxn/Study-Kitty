import { useAuth } from "@clerk/clerk-expo";
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Upgrade } from '../models/upgrade';
import FocusTimer from './components/FocusTimer';
import Furniture from './components/Furniture';
import { getUpgrades } from './upgrade';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { getToken } = useAuth();
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);

  useEffect(() => {
    const fetchUpgrades = async () => {
      const token = await getToken();
      if (!token) return;
      setUpgrades(await getUpgrades(token));
    };
    fetchUpgrades();
  }, [getToken]);

  const handleUpgradePress = () => {
    router.push('/upgrade');
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <Furniture upgrades={upgrades} />
      <View style={styles.content}>
        <FocusTimer onStateChange={setIsTimerActive} />
      </View>
      {!isTimerActive ? 
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
          <Text style={styles.upgradeButtonText}>Upgrade Cafe</Text>
        </TouchableOpacity>
      : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
  },
  content: {
    flex: .4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(46, 44, 44, 0.35)',
    padding: 15,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#F9E4BC',
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
    opacity: 0.9,
  },
}); 