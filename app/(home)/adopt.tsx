import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiRequest } from '../aws/client';
import { getUser, setCachedUserData } from '../aws/users';
import { catDataToCat, CATS_BY_RARITY, getTierCost, RARITY_WEIGHTS } from '../gameData/catData';
import { Cat } from '../models/cat';

const { width, height } = Dimensions.get('window');

// Move utility functions outside component to prevent recreation
const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return '#8B8B8B';
    case 'uncommon': return '#4CAF50';
    case 'rare': return '#2196F3';
    case 'legendary': return '#FFD700';
    default: return '#8B8B8B';
  }
};

const getRarityEmoji = (rarity: string): string => {
  switch (rarity) {
    case 'common': return '⚪';
    case 'uncommon': return '🟢';
    case 'rare': return '🔵';
    case 'legendary': return '⭐';
    default: return '⚪';
  }
};

const TIERS: Array<'common' | 'gold' | 'diamond'> = ['common', 'gold', 'diamond'];

const AdoptScreen: React.FC = () => {
  const { getToken } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wonCat, setWonCat] = useState<Cat | null>(null);
  const [spinAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [userData, setUserData] = useState<any>(null);
  const [tierIndex, setTierIndex] = useState(0);
  const selectedTier = TIERS[tierIndex];

  useEffect(() => {
    let isActive = true;
    
    const fetchUser = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const userData = await getUser(token);
            setUserData(userData);
        } catch (err) {
            if (isActive) {
                console.error("Failed to load data: adopt.tsx");
            }
        }
    };
    
    fetchUser();
  
}, []);

  const performGachaPull = useCallback(async (): Promise<Cat | null> => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return null;
      }

      const cost = getTierCost(selectedTier);
      if (!userData || userData.coins < cost) {
        Alert.alert('Not enough coins', 'You do not have enough coins to adopt a cat.');
        return null;
      }

      const res = await apiRequest("/adopt", "POST", token, { tier: selectedTier });
      console.log(selectedTier)

      // Type guard to ensure res.data has the expected structure
      if (!res.data || typeof res.data !== 'object' || !('rarity' in res.data) || !('id' in res.data) || !('newUserData' in res.data)) {
        throw new Error('Invalid response format');
      }

      const { rarity, id, newUserData } = res.data as { rarity: string; id: string; newUserData: any };
      setCachedUserData(newUserData);
      setUserData(newUserData);
      const catData = CATS_BY_RARITY[selectedTier]?.[rarity]?.find(({ id: catId }) => catId === id);
      console.log(id, rarity)
      if (!catData) {
        throw new Error('Cat data not found');
      }

      return catDataToCat(catData);
    } catch (error) {
      console.error('Error performing gacha pull:', error);
      Alert.alert('Error', 'Failed to pull for cat. Please try again.');
      return null;
    }
  }, [getToken, selectedTier]);

  // Handle gacha pull
  const handleGachaPull = useCallback(async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start spinning animation
    const spinLoop = Animated.loop(
      Animated.timing(spinAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );
    spinLoop.start();

    // Simulate gacha pull delay
    setTimeout(async () => {
      const cat = await performGachaPull();

      if (cat) {
        setWonCat(cat);
        setIsSpinning(false);
        setShowResult(true);

        // Stop the spinning animation
        spinLoop.stop();
        spinAnimation.setValue(0);

        // Trigger haptic feedback based on rarity
        if (cat.rarity === 'legendary') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (cat.rarity === 'rare') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else {
        // Handle failed pull
        setIsSpinning(false);
        spinLoop.stop();
        spinAnimation.setValue(0);
      }
    }, 1500);
  }, [isSpinning, spinAnimation, performGachaPull]);

  // Close result modal
  const closeResult = useCallback(() => {
    setShowResult(false);
    setWonCat(null);
  }, []);

  // Memoize interpolations to prevent recalculation
  const spinInterpolate = useMemo(() =>
    spinAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }), [spinAnimation]);

  const pulseInterpolate = useMemo(() =>
    pulseAnimation.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [1, 1.1, 1],
    }), [pulseAnimation]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
          style={styles.overlay}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Adopt a Cat</Text>
              <Text style={styles.subtitle}>Try your luck at the gacha machine!</Text>

              {/* Coin Display */}
              <View style={styles.coinContainer}>
                <Image
                  source={require('@/assets/images/coin.png')}
                  style={styles.coinIcon}
                />
                <Text style={styles.coinText}>{userData?.coins || 0}</Text>
              </View>
            </View>

            {/* Gacha Machine */}
            <View style={styles.gachaContainer}>
              <View style={styles.machineBody}>
                  <View style={styles.machineTop}>
                    <View style={styles.machineWindow}>
                      <Animated.View
                        style={[
                          styles.spinningCat,
                          {
                            transform: [{ rotate: spinInterpolate }],
                          },
                        ]}
                      >
                        <Image
                          source={require('@/assets/images/cats/Gray Tabby.gif')}
                          style={styles.catPreview}
                        />
                      </Animated.View>
                    </View>
                  </View>
              </View>

              {/* Pull Button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => setTierIndex((prev) => (prev - 1 + TIERS.length) % TIERS.length)}
                  disabled={tierIndex === 0}
                  style={[
                    styles.tierButton,
                    { opacity: tierIndex === 0 ? 0.3 : 1 }
                  ]}
                >
                  <Text style={styles.tierButtonText}>{'<'}</Text>
                </TouchableOpacity>
                <View style={styles.tierDisplay}>
                  <Text style={styles.tierDisplayText}>
                    {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setTierIndex((prev) => (prev + 1) % TIERS.length)}
                  disabled={tierIndex === TIERS.length - 1}
                  style={[
                    styles.tierButton,
                    { opacity: tierIndex === TIERS.length - 1 ? 0.3 : 1 }
                  ]}
                >
                  <Text style={styles.tierButtonText}>{'>'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.pullButton, isSpinning && styles.pullButtonDisabled]}
                onPress={handleGachaPull}
                disabled={isSpinning}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSpinning ? ['#666', '#888'] : ['#B6917E', '#8B6B5A']}
                  style={styles.pullButtonGradient}
                >
                  <Text style={styles.pullButtonText}>
                    {isSpinning ? 'Spinning...' : 'Pull for Cat!'}
                  </Text>
                  <View style={styles.costContainer}>
                    <Image 
                      source={require('@/assets/images/coin.png')} 
                      style={styles.costIcon} 
                    />
                    <Text style={styles.costText}>{getTierCost(selectedTier)}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Rarity Info */}
            <View style={styles.rarityInfo}>
              <Text style={styles.rarityTitle}>Rarity Chances:</Text>
              <View style={styles.rarityList}>
                {Object.entries(RARITY_WEIGHTS).map(([rarity, weight]) => (
                  <View key={rarity} style={styles.rarityItem}>
                    <Text style={styles.rarityEmoji}>{getRarityEmoji(rarity)}</Text>
                    <Text style={styles.rarityText}>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}: {weight}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Result Modal */}
      <Modal
        visible={showResult}
        transparent
        animationType="fade"
        onRequestClose={closeResult}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#FFF5E6', '#F9E4BC']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>You got a cat!</Text>
              </View>

              {wonCat && (
                <View style={styles.catResult}>
                  <View style={styles.catImageContainer}>
                    <Image
                      source={wonCat.animation}
                      style={styles.catResultImage}
                    />
                  </View>

                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{wonCat.name}</Text>
                    <View style={styles.rarityBadge}>
                      <Text style={styles.rarityBadgeEmoji}>
                        {getRarityEmoji(wonCat.rarity)}
                      </Text>
                      <Text style={[
                        styles.rarityBadgeText,
                        { color: getRarityColor(wonCat.rarity) }
                      ]}>
                        {wonCat.rarity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeResult}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#B6917E', '#8B6B5A']}
                  style={styles.closeButtonGradient}
                >
                  <Text style={styles.closeButtonText}>Adopt!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF5E6',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#F9E4BC',
    marginTop: 5,
    fontFamily: 'Quicksand_500Medium',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    marginBottom: 15,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 230, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
    marginBottom: -16,
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  coinIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  coinText: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
  },
  gachaContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  machineBody: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  machineGradient: {
    flex: 1,
    padding: 20,
  },
  machineTop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  machineWindow: {
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(238, 192, 123, 0.15)',
    borderWidth: 3,
    borderColor: 'rgb(245, 192, 143)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  spinningCat: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catPreview: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  machineBottom: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lever: {
    width: 4,
    height: 40,
    backgroundColor: '#FFF5E6',
    borderRadius: 2,
  },

  pullButton: {
    width: 200,
    height: 60,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
  },
  pullButtonDisabled: {
    opacity: 0.6,
  },
  pullButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pullButtonText: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
    marginBottom: 4,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  costIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  costText: {
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
  },
  rarityInfo: {
    backgroundColor: 'rgba(255, 245, 230, 0.95)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 40,
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  rarityTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
    marginBottom: 12,
    textAlign: 'center',
  },
  rarityList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    minWidth: '45%',
  },
  rarityEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  rarityText: {
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
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
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
  },
  modalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
    textAlign: 'center',
  },
  catResult: {
    alignItems: 'center',
    marginBottom: 30,
  },
  catImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 245, 230, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFF5E6',
  },
  catResultImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  catInfo: {
    alignItems: 'center',
  },
  catName: {
    fontSize: 22,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
    marginBottom: 8,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 230, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B6917E',
  },
  rarityBadgeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  rarityBadgeText: {
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
  },
  closeButton: {
    width: 150,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
  },
  closeButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#FFF5E6',
  },
  tierButton: {
    padding: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 245, 230, 0.95)',
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tierButtonText: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D1810',
  },
  tierDisplay: {
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 245, 230, 0.95)',
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tierDisplayText: {
    color: '#2D1810',
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
  },
});

export default AdoptScreen; 