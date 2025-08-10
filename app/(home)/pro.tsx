import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useUser } from '@clerk/clerk-expo';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

type SubscriptionTier = {
    id: string;
    name: string;
    price: string;
    period: string;
    features: string[];
    popular: boolean;
    gradient: [string, string];
    pkg: PurchasesPackage;
};

type CarouselItem = {
    id: string;
    image: any;
    title?: string;
    description?: string;
};

export default function Pro() {
    const router = useRouter();
    const { user } = useUser();
    const { width: screenWidth } = useWindowDimensions();
    const flatListRef = useRef<FlatList>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [offerings, setOfferings] = useState<any>(null);

    useEffect(() => {
        getOfferings()
    }, [])

    const getOfferings = async () => {
        try {
            const offerings = await Purchases.getOfferings();

            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                console.log("Offeringssss", JSON.stringify(offerings, null, 2))
                setOfferings(offerings);
            }
        } catch (error) {
            console.error("Error fetching offerings:", error);
            // Don't crash the app, just log the error
        }
    }

    // Carousel data - you can add more images here
    const carouselData: CarouselItem[] = [
        {
            id: '1',
            image: require('@/assets/images/cat-cafe-banner.png'),
            title: 'Earn More',
            description: '2x coins with Pro'
        },
        {
            id: '2',
            image: require('@/assets/images/Stats3.png'),
            title: 'Statistics',
            description: 'Unlock valuable insight on your studying session.'
        },
        {
            id: '3',
            image: require('@/assets/images/tags.png'),
            title: 'Custom Tags',
            description: 'Tag your sessions to see how your time is being spent.'
        },

    ];

    const subscriptionTiers: SubscriptionTier[] = [
        {
            id: 'monthly',
            name: 'Monthly',
            price: offerings?.current?.monthly?.product?.priceString || '$4.99',
            period: 'per month',
            features: [
                '2x Coins',
                'Advanced statistics',
                'Custom Tagging',
                'Exclusive cat breeds',
            ],
            popular: false,
            gradient: ['rgba(255, 245, 230, 0.15)', 'rgba(249, 228, 188, 0.15)'],
            pkg: offerings?.current?.availablePackages?.find((pkg: any) => pkg.packageType === 'MONTHLY')
        },
        {
            id: 'yearly',
            name: 'Yearly',
            price: offerings?.current?.annual?.product?.priceString || '$39.99',
            period: 'per year',
            features: [
                'All Monthly features',
                '6 months free',
                'Save 50%',
                'Best value',
            ],
            popular: true,
            gradient: ['rgba(255, 220, 150, 0.25)', 'rgba(255, 200, 100, 0.25)'],
            pkg: offerings?.current?.availablePackages?.find((pkg: any) => pkg.packageType === 'ANNUAL')
        }
    ];

    const handleSubscribe = async (pkg: PurchasesPackage) => {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            if (typeof customerInfo.entitlements.active["Pro"] !== "undefined") {
                console.log("Customer Info", JSON.stringify(customerInfo));
                Alert.alert("Success", "Thank you for subscribing to Study Kitty Pro!");
            }
        } catch (e: any) {
            // Check if the purchase was cancelled by the user
            if (!e.userCancelled) {
                Alert.alert("Error", "An error occurred while processing your purchase. Please try again.");
                console.error("Purchase error:", e);
            }
        }
    }

    const renderCarouselItem = ({ item }: { item: CarouselItem }) => (
        <View style={[styles.carouselItem, { width: screenWidth }]}>
            <ExpoImage
                source={item.image}
                style={styles.carouselImage}
                contentFit="contain"
                cachePolicy="disk"
            />
            <View style={styles.carouselOverlay}>
                {item.title && (
                    <Text style={styles.carouselTitle}>{item.title}</Text>
                )}
                {item.description && (
                    <Text style={styles.carouselDescription}>{item.description}</Text>
                )}
            </View>
        </View>
    );

    const renderPaginationDots = () => (
        <View style={styles.paginationContainer}>
            {carouselData.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.paginationDot,
                        index === activeIndex && styles.paginationDotActive
                    ]}
                />
            ))}
        </View>
    );

    const onViewableItemsChanged = ({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    };

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50
    };

    return (
        <ThemedView style={styles.container}>
            <ExpoImage
                source={require('@/assets/images/background.webp')}
                style={styles.backgroundImage}
                contentFit="cover"
                cachePolicy="disk"
            />
            <View style={styles.darkOverlay} />
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.title}>Study-Kitty Pro</Text>
                    <Text style={styles.subtitle}>Upgrade your study experience with premium features</Text>
                </View>

                {/* Carousel Section */}
                <View style={styles.carouselContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={carouselData}
                        renderItem={renderCarouselItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        snapToInterval={screenWidth}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        getItemLayout={(data, index) => ({
                            length: screenWidth,
                            offset: screenWidth * index,
                            index,
                        })}
                    />
                    {renderPaginationDots()}
                </View>

                <View style={styles.pricingContainer}>
                    {subscriptionTiers.map((tier) => (
                        <View
                            key={tier.id}
                            style={[
                                styles.pricingCard,
                                tier.popular && styles.popularCard
                            ]}
                        >
                            {tier.popular && (
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                                </View>
                            )}
                            <LinearGradient
                                colors={tier.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.pricingHeader}
                            >
                                <Text style={styles.tierName}>{tier.name}</Text>
                                <Text style={styles.tierPrice}>{tier.price}</Text>
                                <Text style={styles.tierPeriod}>{tier.period}</Text>
                            </LinearGradient>
                            <View style={styles.featuresList}>
                                {tier.features.map((feature, index) => (
                                    <View key={index} style={styles.featureItem}>
                                        <FontAwesome5 name="check-circle" size={16} color="#B6917E" />
                                        <Text style={styles.featureItemText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.subscribeButton,
                                    tier.popular && styles.popularButton
                                ]}
                                onPress={() => handleSubscribe(tier.pkg)}
                            >
                                <Text style={styles.subscribeButtonText}>
                                    {tier.popular ? 'Get Started' : 'Choose Plan'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    header: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Quicksand_700Bold',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF5E6',
        textShadowColor: '#2D1810',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#F9E4BC',
        marginTop: 5,
        fontFamily: 'Quicksand_500Medium',
        textShadowColor: '#2D1810',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        textAlign: 'center',
        paddingLeft: 15,
        paddingRight: 15,
    },
    carouselContainer: {
        marginVertical: 20,
    },
    carouselItem: {
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    carouselOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(45, 24, 16, 0.8)',
        padding: 16,
    },
    carouselTitle: {
        color: '#FFF5E6',
        fontSize: 18,
        fontFamily: 'Quicksand_700Bold',
        marginBottom: 4,
        textAlign: "center",
    },
    carouselDescription: {
        color: '#F9E4BC',
        fontSize: 14,
        fontFamily: 'Quicksand_500Medium',
        textAlign: "center",
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(249, 228, 188, 0.4)',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: '#B6917E',
        width: 24,
    },
    pricingContainer: {
        padding: 16,
    },
    pricingCard: {
        backgroundColor: 'rgba(255, 245, 230, 0.95)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgb(87, 53, 25)',
        shadowColor: '#2D1810',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    popularCard: {
        borderColor: '#B6917E',
        borderWidth: 3,
    },
    popularBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#B6917E',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        zIndex: 1,
        borderWidth: 1,
        borderColor: '#8B7355',
    },
    popularBadgeText: {
        color: '#FFF5E6',
        fontSize: 10,
        fontFamily: 'Quicksand_700Bold',
    },
    pricingHeader: {
        padding: 12,
        alignItems: 'center',
    },
    tierName: {
        color: '#2D1810',
        fontSize: 20,
        fontFamily: 'Quicksand_700Bold',
        marginBottom: 4,
    },
    tierPrice: {
        color: '#2D1810',
        fontSize: 24,
        fontFamily: 'Quicksand_700Bold',
        marginBottom: 2,
    },
    tierPeriod: {
        color: '#8B7355',
        fontSize: 12,
        fontFamily: 'Quicksand_500Medium',
    },
    featuresList: {
        padding: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    featureItemText: {
        marginLeft: 10,
        color: '#2D1810',
        fontSize: 13,
        fontFamily: 'Quicksand_500Medium',
    },
    subscribeButton: {
        margin: 12,
        marginTop: 0,
        padding: 10,
        backgroundColor: 'rgba(117, 182, 125, 0.95)',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#75B67D',
    },
    popularButton: {
        backgroundColor: '#B6917E',
        borderColor: '#8B7355',
    },
    subscribeButtonText: {
        color: '#FFF5E6',
        fontSize: 14,
        fontFamily: 'Quicksand_700Bold',
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Quicksand_700Bold',
        color: Colors.text,
        marginBottom: 20,
    },
});