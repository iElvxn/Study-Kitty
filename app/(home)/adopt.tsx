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
import { catDataToCat, CATS_BY_RARITY, RARITY_WEIGHTS } from '../gameData/catData';
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

      const res = await apiRequest("/adopt", "POST", token, { tier: selectedTier });
      console.log(selectedTier)

      // Type guard to ensure res.data has the expected structure
      if (!res.data || typeof res.data !== 'object' || !('rarity' in res.data) || !('id' in res.data) || !('userData' in res.data)) {
        throw new Error('Invalid response format');
      }

      const { rarity, id, userData } = res.data as { rarity: string; id: string; userData: any };
      setCachedUserData(userData);
      setUserData(userData);
      const catData = CATS_BY_RARITY[selectedTier]?.[rarity]?.find(({ id: catId }) => catId === id);

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
                <LinearGradient
                  colors={['#2D1810', '#4A2C1A', '#2D1810']}
                  style={styles.machineGradient}
                >
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

                  <View style={styles.machineBottom}>
                    <View style={styles.leverContainer}>
                      <View style={styles.lever} />
                      <Animated.View
                        style={[
                          styles.leverHandle,
                          {
                            transform: [{ scale: pulseInterpolate }],
                          },
                        ]}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Pull Button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => setTierIndex((prev) => (prev - 1 + TIERS.length) % TIERS.length)}
                  disabled={tierIndex === 0}
                  style={{ opacity: tierIndex === 0 ? 0.3 : 1, padding: 10 }}
                >
                  <Text style={{ fontSize: 24 }}>{'<'}</Text>
                </TouchableOpacity>
                <View style={{
                  padding: 10,
                  marginHorizontal: 8,
                  borderRadius: 10,
                  backgroundColor: '#A89BD4',
                  borderWidth: 2,
                  borderColor: '#6C5B7B',
                  minWidth: 80,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: 18
                  }}>
                    {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setTierIndex((prev) => (prev + 1) % TIERS.length)}
                  disabled={tierIndex === TIERS.length - 1}
                  style={{ opacity: tierIndex === TIERS.length - 1 ? 0.3 : 1, padding: 10 }}
                >
                  <Text style={{ fontSize: 24 }}>{'>'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.pullButton, isSpinning && styles.pullButtonDisabled]}
                onPress={handleGachaPull}
                disabled={isSpinning}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSpinning ? ['#666', '#888'] : ['#C7B6F5', '#A89BD4']}
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
                    <Text style={styles.costText}>100</Text>
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
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Quicksand_700Bold',
    color: '#FFF5E6',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_500Medium',
    color: '#E6D5BC',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 15,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 230, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(230, 162, 61, 0.9)',
    marginBottom: -16,
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
    height: 320,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: '#FFF5E6',
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
  leverHandle: {
    width: 20,
    height: 20,
    backgroundColor: '#C7B6F5',
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#FFF5E6',
  },
  pullButton: {
    width: 200,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: 'rgba(255, 245, 230, 0.9)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 40,
    borderWidth: 5,
    borderColor: '#B6917E',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5BC',
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
});

export default AdoptScreen; 