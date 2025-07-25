import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getUser } from '@/app/aws/users';
import { CatData, getAllCats } from '@/app/gameData/catData';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with margins

const rarityColors = {
  common: '#B6917E',
  uncommon: '#75B67D',
  rare: '#8B9DC3',
  legendary: '#D4A373',
};

const rarityNames = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

export default function PurrdexScreen() {
  const { getToken } = useAuth();
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);
  const [userCats, setUserCats] = useState<Record<string, { quantity: number; rarity: string }>>({});
  const [loading, setLoading] = useState(true);
  const [areImagesLoaded, setAreImagesLoaded] = useState(false);

  const allCats = useMemo(() => getAllCats(), []);

  // Preload cat images
  useEffect(() => {
    let isMounted = true;
    
    const preloadImages = async () => {
      try {
        if (allCats.length > 0) {
          const imageUris = allCats.map(cat => 
            typeof cat.animation === 'string' ? cat.animation : 
            typeof cat.animation === 'object' && cat.animation?.uri ? cat.animation.uri : 
            null
          ).filter(Boolean) as string[];
          
          if (imageUris.length > 0) {
            await ExpoImage.prefetch(imageUris);
          }
        }
      } catch (error) {
        console.error('Error preloading images:', error);
      } finally {
        if (isMounted) {
          setAreImagesLoaded(true);
        }
      }
    };

    preloadImages();
    
    return () => {
      isMounted = false;
    };
  }, [allCats]);

  // Fetch user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchUserData = async () => {
        try {
          const token = await getToken();
          if (!token || !isActive) return;

          const userData = await getUser(token);
          if (!isActive) return;

          setUserCats(userData.cats || {});
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchUserData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const filteredCats = useMemo(() => {
    let filtered = allCats.map(catData => {
      const userCat = userCats[catData.id];
      const quantity = Number(userCat?.quantity || 0);
      return {
        ...catData,
        quantity: quantity,
        owned: quantity > 0
      };
    });

    // Filter by rarity
    if (selectedRarity) {
      filtered = filtered.filter(cat => cat.rarity === selectedRarity);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by owned only
    if (showOwnedOnly) {
      filtered = filtered.filter(cat => cat.owned);
    }

    return filtered;
  }, [selectedRarity, searchQuery, showOwnedOnly, userCats]);

  const renderCatCard = ({ item }: { item: CatData & { quantity: number; owned: boolean } }) => (
    <TouchableOpacity
      style={[
        styles.catCard,
        { opacity: item.owned ? 1 : 0.6 }
      ]}
      activeOpacity={0.8}
    >
      <ExpoImage
        source={item.animation}
        style={styles.catImage}
        contentFit="contain"
        cachePolicy="disk"
      />
      <View style={styles.catInfo}>
        <Text style={styles.catName}>{item.name}</Text>
        <View style={[styles.rarityBadge, { backgroundColor: rarityColors[item.rarity] }]}>
          <Text style={styles.rarityText}>{rarityNames[item.rarity]}</Text>
        </View>
        <View style={styles.quantityContainer}>
          <Ionicons
            name={item.owned ? "checkmark-circle" : "close-circle"}
            size={18}
            color={item.owned ? "#75B67D" : "#B6917E"}
          />
          <Text style={styles.quantityText}>
            {item.quantity} owned
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRarityFilter = (rarity: string) => (
    <TouchableOpacity
      key={rarity}
      style={[
        styles.rarityFilter,
        selectedRarity === rarity && styles.rarityFilterActive,
        { borderColor: rarityColors[rarity as keyof typeof rarityColors] }
      ]}
      onPress={() => setSelectedRarity(selectedRarity === rarity ? null : rarity)}
    >
      <Text style={[
        styles.rarityFilterText,
        selectedRarity === rarity && styles.rarityFilterTextActive
      ]}>
        {rarityNames[rarity as keyof typeof rarityNames]}
      </Text>
    </TouchableOpacity>
  );

  const ownedCount = Object.values(userCats).reduce((sum: number, cat: { quantity: number; rarity: string }) => sum + (Number(cat.quantity) > 0 ? 1 : 0), 0);
  const totalCount = allCats.length;

  // Show loading state while data is being fetched
  if (loading || !areImagesLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ExpoImage
          source={require('@/assets/images/background.jpg')}
          style={styles.backgroundImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={styles.darkOverlay} />
        <ActivityIndicator size="large" color="#B6917E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoImage
        source={require('@/assets/images/background.jpg')}
        style={styles.backgroundImage}
        contentFit="cover"
        cachePolicy="disk"
      />
      <View style={styles.darkOverlay} />
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Purrdex</Text>
          <Text style={styles.subtitle}>
            {ownedCount}/{totalCount} cats discovered
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#B6917E" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cats..."
            placeholderTextColor="#B6917E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Rarity Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            data={Object.keys(rarityColors)}
            renderItem={({ item }) => renderRarityFilter(item)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        {/* Owned Only Toggle */}
        <TouchableOpacity
          style={styles.ownedToggle}
          onPress={() => setShowOwnedOnly(!showOwnedOnly)}
        >
          <Ionicons
            name={showOwnedOnly ? "checkbox" : "square-outline"}
            size={20}
            color={showOwnedOnly ? "#75B67D" : "#B6917E"}
          />
          <Text style={styles.ownedToggleText}>Show owned only</Text>
        </TouchableOpacity>

        {/* Cats Grid */}
        <FlatList
          data={filteredCats}
          renderItem={renderCatCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.catRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.catsGrid}
        />
      </View>
    </View>
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
    fontSize: 16,
    color: '#F9E4BC',
    marginTop: 5,
    fontFamily: 'Quicksand_500Medium',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 230, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#2D1810',
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersList: {
    paddingHorizontal: 5,
  },
  rarityFilter: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    marginRight: 10,
    backgroundColor: 'rgba(255, 245, 230, 0.9)',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rarityFilterActive: {
    backgroundColor: 'rgba(255, 245, 230, 0.95)',
    shadowOpacity: 0.2,
  },
  rarityFilterText: {
    fontSize: 14,
    color: '#2D1810',
    fontFamily: 'Quicksand_600SemiBold',
  },
  rarityFilterTextActive: {
    color: '#2D1810',
    fontWeight: 'bold',
  },
  ownedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 245, 230, 0.9)',
    padding: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgb(87, 53, 25)',
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownedToggleText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2D1810',
    fontFamily: 'Quicksand_600SemiBold',
  },
  catsGrid: {
    paddingBottom: 20,
  },
  catRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  catCard: {
    width: cardWidth,
    backgroundColor: 'rgba(255, 245, 230, 0.95)',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#2D1810',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'rgb(87, 53, 25)',
  },
  catImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  catInfo: {
    alignItems: 'center',
    width: '100%',
  },
  catName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#2D1810',
    fontFamily: 'Quicksand_700Bold',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rarityText: {
    fontSize: 12,
    color: '#FFF5E6',
    fontWeight: 'bold',
    fontFamily: 'Quicksand_700Bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    color: '#2D1810',
    marginLeft: 5,
    fontFamily: 'Quicksand_500Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 