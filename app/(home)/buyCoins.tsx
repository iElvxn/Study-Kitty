import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 columns with margins

type CoinPackage = {
  id: string;
  amount: number;
  price: string;
  bonus?: number;
  popular?: boolean;
};

type CarouselItem = {
  id: string;
  image: any;
  title: string;
  description: string;
};

export default function BuyCoinsScreen() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const carouselRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const coinPackages: CoinPackage[] = [
    { id: 'small', amount: 100, price: '$0.99', bonus: 0 },
    { id: 'medium', amount: 300, price: '$2.49', bonus: 30, popular: true },
    { id: 'large', amount: 700, price: '$4.99', bonus: 100 },
    { id: 'xlarge', amount: 1500, price: '$9.99', bonus: 300 },
  ];

  const carouselData: CarouselItem[] = [
    {
      id: '1',
      image: require('@/assets/images/coin.png'),
      title: 'Special Offer!',
      description: 'Get 30% more coins with our best-selling package'
    },
    {
      id: '2',
      image: require('@/assets/images/coin.png'),
      title: 'Limited Time',
      description: 'Double coins on your first purchase!'
    },
  ];

  const handleBuy = (pkg: CoinPackage) => {
    // TODO: Implement purchase logic
    console.log('Buying package:', pkg);
    setSelectedPackage(pkg.id);
  };

  const renderCarouselItem = ({ item }: { item: CarouselItem }) => (
    <View style={[styles.carouselItem, { width: width - 40 }]}>
      <ExpoImage
        source={item.image}
        style={styles.carouselImage}
        contentFit="cover"
        cachePolicy="disk"
      />
      <View style={styles.carouselTextContainer}>
        <Text style={styles.carouselTitle}>{item.title}</Text>
        <Text style={styles.carouselDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const renderPackage = ({ item }: { item: CoinPackage }) => (
    <TouchableOpacity
      style={[
        styles.packageCard,
        selectedPackage === item.id && styles.selectedPackage,
        item.popular && styles.popularPackage
      ]}
      onPress={() => handleBuy(item)}
      activeOpacity={0.8}
    >
      {item.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>BEST VALUE</Text>
        </View>
      )}
      <View style={styles.coinContainer}>
        <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
        <Text style={styles.coinAmount}>{item.amount}</Text>
        {item.bonus ? (
          <Text style={styles.bonusText}>+{item.bonus} bonus</Text>
        ) : null}
      </View>
      <Text style={styles.priceText}>{item.price}</Text>
      <TouchableOpacity style={styles.buyButton}>
        <Text style={styles.buyButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ExpoImage
        source={require('@/assets/images/background.jpg')}
        style={styles.backgroundImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.darkOverlay} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Buy Coins</Text>
        <Text style={styles.subtitle}>Get coins to adopt new cats and decorate your cafe!</Text>
        
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
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'DMSans-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 24,
    fontFamily: 'DMSans-Regular',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 16,
    fontFamily: 'DMSans-SemiBold',
  },
  carouselContainer: {
    height: 160,
    marginBottom: 20,
  },
  carouselItem: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  carouselTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'DMSans-Bold',
  },
  carouselDescription: {
    color: '#E0E0E0',
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#B6917E',
    width: 20,
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
  selectedPackage: {
    borderColor: '#B6917E',
    backgroundColor: 'rgba(182, 145, 126, 0.2)',
  },
  popularPackage: {
    borderColor: '#D4A373',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: -20,
    backgroundColor: '#D4A373',
    paddingVertical: 2,
    paddingHorizontal: 24,
    transform: [{ rotate: '45deg' }],
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'DMSans-Bold',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coinAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
    fontFamily: 'DMSans-Bold',
  },
  bonusText: {
    fontSize: 12,
    color: '#75B67D',
    marginLeft: 8,
    fontFamily: 'DMSans-Medium',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    fontFamily: 'DMSans-Bold',
  },
  buyButton: {
    backgroundColor: '#B6917E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'DMSans-SemiBold',
  },
});
