import { useTimer } from '@/context/TimerContext';
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Suspense, useCallback, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useUpgrade } from '../UpgradeContext';
import { apiRequest } from '../aws/client';
import { getCachedUserData, setCachedUserData } from '../aws/users';
import { Upgrade } from '../models/upgrade';
import Cats from "./components/Cats";
import FocusTimer from './components/FocusTimer';
import Furniture from './components/Furniture';
import Tags from './components/Tags';
import { getSettings } from './settings';
import { fetchUserUpgrades, getUpgrades } from "./upgrade";

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { userId } = useAuth();
  const { isTimerActive, setIsTimerActive } = useTimer();
  const [sessionTime, setSessionTime] = useState(25 * 60);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const { refreshTrigger } = useUpgrade();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const chimeSound = require('@/assets/chime.mp3');
  const audioPlayer = useAudioPlayer(chimeSound);


  const completionQuotes: String[] = [
    "Paws and reflect, session complete! 🐾",
    "You stayed pawsitive and nailed it! 🎉",
    "Purr-sistence pays off! You did it! 🐾",
    "Another chill study sesh in the catfe. ☕🐱",
    "Meow-gnificent focus! Time for a stretch? 🐈‍⬛"
  ]

  const [modalQuote, setModalQuote] = useState(completionQuotes[0]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const getUpgradeData = async () => {
        try {
          const token = await getToken();
          if (!token || !isActive) return;
          const [staticUpgrades, userUpgradeLevelsRaw] = await Promise.all([
            getUpgrades(token),
            fetchUserUpgrades(token),
          ]);
          const userUpgradeLevels: Record<string, number> = (userUpgradeLevelsRaw && typeof userUpgradeLevelsRaw === 'object' && !Array.isArray(userUpgradeLevelsRaw)) ? userUpgradeLevelsRaw as Record<string, number> : {};
          if (!isActive) return;
          const mergedUpgrades = staticUpgrades.map(upg => ({
            ...upg,
            level: userUpgradeLevels[upg.id] || 1,
          }));
          setUpgrades(mergedUpgrades);
        } catch (error) {
          console.error('Error fetching upgrade data:', error);
        }
      };

      getUpgradeData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleUpgradePress = useCallback(() => {
    router.push('/upgrade');
  }, []);

  const handleSessionComplete = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log("No token?");
        return;
      }
      const res = await apiRequest("/session", "POST", token, { sessionDuration: sessionTime, tag: selectedTag });
      const data = res.data as { newBalance: number; coinsAwarded: number, newProductivity: any };
      const newBalance = data.newBalance;
      const newProductivity = data.newProductivity

      setEarnedAmount(data.coinsAwarded);
      // Pick a random quote for the modal
      const randomIdx: number = Math.floor(Math.random() * completionQuotes.length);
      setModalQuote(completionQuotes[randomIdx]);
      setShowRewardModal(true);

      const settings = await getSettings();
      console.log(settings);
      if (settings.vibration) {
        Vibration.vibrate([0, 500, 100, 500]); // Three strong 1-second vibrations
      }

      if (settings.chime) {
        audioPlayer.seekTo(0);
        audioPlayer.play();
      }
      // Update the cache
      const cachedUser = await getCachedUserData();
      if (cachedUser) {
        const updatedUser = { ...cachedUser, coins: newBalance, productivity: newProductivity };
        await setCachedUserData(updatedUser);
      }
    } catch (error) {
      console.log("Error in handleSessionComplete:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/background.webp')}
        style={styles.backgroundImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey="background-image"
      />
      <Suspense fallback={null}>
        <Furniture upgrades={upgrades} />
      </Suspense>
      {isTimerActive && <Cats sessionTime={sessionTime} />}
      <View style={styles.content}>
        <FocusTimer 
          onStateChange={setIsTimerActive} 
          onSessionTimeChange={setSessionTime} 
          onComplete={handleSessionComplete} 
        />
      </View>
      {!isTimerActive ?
        <View style={styles.homeButtons}>
          <TouchableOpacity style={styles.upgradeButton} onPress={() => setShowTagsModal(true)}>
            <Text style={styles.upgradeButtonText}>Tags</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
            <Text style={styles.upgradeButtonText}>Upgrade Cafe</Text>
          </TouchableOpacity>
        </View>

        : null
      }
      {/* Reward Modal */}
      <Modal
        visible={showRewardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRewardModal(false)}
        accessible
        accessibilityViewIsModal
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalQuote}</Text>
            <Text style={styles.modalText}>Studied for {sessionTime / 60} minutes</Text>
            <Text style={styles.modalText}>You earned</Text>
            <View style={styles.coinRow}>
              <Image source={require('@/assets/images/coin.png')} style={styles.coinIcon} />
              <Text style={styles.earnedAmount}>{earnedAmount}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              onPress={() => setShowRewardModal(false)}
              accessibilityLabel="Close reward modal"
            >
              <Text style={styles.closeButtonText}>Yay!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {showTagsModal && (
        <Tags
          setShowTagsModal={setShowTagsModal}
          onTagsUpdate={(selectedTag: string | null) => {
            setSelectedTag(selectedTag);
          }}
          initialSelectedTag={selectedTag}
        />
      )}
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
  homeButtons: {
    width: '100%',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
  },
  upgradeButton: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    padding: 30,
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 20,
    color: '#2D1810',
    marginBottom: 10,
    fontFamily: 'Quicksand_500Medium',
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  coinIcon: {
    width: 34,
    height: 34,
    marginRight: 8,
  },
  earnedAmount: {
    fontSize: 32,
    fontFamily: 'Quicksand_700Bold',
    color: '#B6917E',
  },
  closeButton: {
    backgroundColor: '#B6917E',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF5E6',
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
  },
}); 