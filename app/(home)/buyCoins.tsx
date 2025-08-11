import { ThemedView } from '@/components/ThemedView';
import { useAuth } from "@clerk/clerk-expo";
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { apiRequest } from '../aws/client';
import { getCachedUserData, setCachedUserData } from '../aws/users';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 columns with margins

type CoinPackage = {
  id: string;
  amount: number;
  price: string;
  bonus?: number;
  popular?: boolean;
  pkg: PurchasesPackage;
};

export default function BuyCoinsScreen() {
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();


  useEffect(() => {
    getOfferings();
  }, []);

  const getOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();

      if (offerings.current) {
        const coinProducts = offerings.current.availablePackages
          .filter(pkg => pkg.product.productType === 'CONSUMABLE')
          .map(pkg => {
            // Extract the coin amount from the product identifier
            const amount = parseInt(pkg.product.identifier);
            return {
              id: pkg.identifier,
              amount: amount,
              price: pkg.product.priceString,
              bonus: calculateBonus(amount),
              popular: amount === 2500, // Mark 2500 coins as popular
              pkg: pkg
            };
          })
          .sort((a, b) => a.amount - b.amount); // Sort by coin amount

        setCoinPackages(coinProducts);
      }
    } catch (error) {
      console.error("Error fetching offerings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBonus = (amount: number): number => {
    // Calculate bonus based on the package size
    if (amount >= 2500) return 500;
    if (amount >= 1200) return 200;
    if (amount >= 550) return 50;
    return 0;
  };

  const handleBuy = async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      const productId = pkg.product.identifier;
      console.log("User bought:", productId);

      const token = await getToken();
      if (!token) return;
      const res = await apiRequest("/coin", "POST", token, { productId: productId });
      const newBalance = (res.data as any).newBalance;
      const cachedUser = await getCachedUserData();
      if (cachedUser) {
        const updatedUser = { ...cachedUser, coins: newBalance };
        await setCachedUserData(updatedUser);
      }
    } catch (error) {
      if (!(error instanceof Purchases.PurchasesError) || !error.userCancelled) {
        console.error("Purchase error:", error);
        Alert.alert("Error", "Failed to complete purchase. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (coinPackages.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Text>No coin packages available</Text>
      </ThemedView>
    );
  }

  const renderPackage = ({ item }: { item: CoinPackage }) => (
    <TouchableOpacity
      style={[
        styles.packageCard,
        item.popular && styles.popularPackage
      ]}
      onPress={() => handleBuy(item.pkg)}
      activeOpacity={0.8}
    >
      {item.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>BEST VALUE</Text>
        </View>
      )}
      <View style={styles.coinContainer}>
        <View style={styles.coinRow}>
          <ExpoImage
            source={require('@/assets/images/coin.png')}
            style={styles.coinImage}
            contentFit="cover"
            cachePolicy="disk"
          />
          <Text style={styles.coinAmount}>{item.amount}</Text>
        </View>
        <Text style={styles.bonusText}>+{item.bonus} bonus</Text>
      </View>
      <Text style={styles.priceText}>{item.price}</Text>
      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => handleBuy(item.pkg)}
      >
        <Text style={styles.buyButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ExpoImage
        source={require('@/assets/images/background.webp')}
        style={styles.backgroundImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.darkOverlay} />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Buy Coins</Text>
          <Text style={styles.subtitle}>
            Get coins to adopt new cats and decorate your cafe!
          </Text>
        </View>

        {/* Coin Packages */}
        <Text style={styles.sectionTitle}>Available Packages</Text>
        <FlatList
          data={coinPackages}
          renderItem={renderPackage}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.packageRow}
          contentContainerStyle={styles.packageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Go Pro Button */}
        <TouchableOpacity style={styles.goProButton} onPress={() => router.push('/pro')}>
          <View style={styles.goProButtonContent}>
            <ExpoImage
              source={require('@/assets/images/Crown.png')}
              style={styles.crownIcon}
              contentFit="contain"
              cachePolicy="disk"
            />
            <Text style={styles.goProButtonText}>GO PRO</Text>
          </View>
          <Text style={styles.goProButtonSubtext}>Unlock Premium Features</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#2D1810', fontFamily: 'Quicksand_700Bold', fontSize: 18 }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF5E6',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#F9E4BC',
    marginTop: 5,
    fontFamily: 'Quicksand_500Medium',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitle: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 16,
    fontFamily: 'Quicksand_500Medium',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coinImage: {
    width: 30,
    height: 30,
  },
  coinAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
    fontFamily: 'Quicksand_700Bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  packageList: {
    paddingBottom: 20,
  },
  packageRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  packageCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  popularPackage: {
    borderColor: '#D4A373',
  },
  popularBadge: {
    position: 'absolute',
    backgroundColor: '#B6917E',
    top: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#8B7355',
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
  },
  coinContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 12,
  },
  bonusText: {
    fontSize: 16,
    color: '#75B67D',
    fontFamily: 'Quicksand_700Bold',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    fontFamily: 'Quicksand_700Bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buyButton: {
    backgroundColor: '#B6917E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(221, 179, 145, 0.98)',
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Quicksand_700Bold',
  },
  goProButton: {
    backgroundColor: 'rgb(158, 118, 160)',
    borderRadius: 25,
    padding: 12,
    marginBottom: 30,
    borderWidth: 4,
    borderColor: 'rgba(93, 70, 95, 0.63)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  goProButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    marginLeft: -30,
  },
  goProButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Quicksand_700Bold',
    letterSpacing: 1,
  },
  goProButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Quicksand_500Medium',
  },
  backButton: {
    backgroundColor: '#F9E4BC',
    padding: 10,
    borderRadius: 18,
    alignItems: 'center',
    zIndex: 1000,
    borderWidth: 5,
    borderColor: '#caa867',
    marginBottom: 25,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
