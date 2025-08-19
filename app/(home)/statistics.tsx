import { useAuth } from '@clerk/clerk-expo';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Purchases from 'react-native-purchases';
import { getUser } from '../aws/users';
import { UserRecord } from '../models/user';

const { width } = Dimensions.get('window');

type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface StatCard {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
}

export default function Statistics() {
  const { getToken } = useAuth();
  const [userData, setUserData] = useState<UserRecord | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    Image.prefetch(require('@/assets/images/background.jpg'));

    const checkProStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (typeof customerInfo.entitlements.active["Pro"] !== "undefined") {
          setIsPro(true);
        }
      } catch (error) {
        console.error("Error checking pro status:", error);
        setIsPro(false);
      }
    };

    checkProStatus();
  }, []);

  // Fetch user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchUserData = async () => {
        try {
          const token = await getToken();
          if (!token || !isActive) return;

          const user = await getUser(token);
          if (isActive) {
            setUserData(user);
          }
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

  const productivity = userData?.productivity;

  // Get available tags from recent sessions
  const getAvailableTags = (): string[] => {
    if (!productivity?.recentSessions) return [];

    const tags = new Set<string>();
    productivity.recentSessions.forEach(session => {
      if (session.tag && session.tag.trim()) {
        tags.add(session.tag);
      }
    });
    return Array.from(tags);
  };

  // Get data for selected time period
  const getTimeSeriesData = () => {
    if (!productivity) return { labels: [], datasets: [{ data: [] }] };

    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    if (selectedPeriod === 'day') {
      // Current day - show hourly breakdown (or sessions if no hourly data)
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      const todayStats = productivity.dailyStats[today];

      if (todayStats && productivity.recentSessions) {
        // Get today's sessions and group by hour
        const todaySessions = productivity.recentSessions.filter(session =>
          session.date === today
        );

        const hourlyData: Record<number, number> = {};

        // Initialize all hours to 0
        for (let hour = 0; hour < 24; hour++) {
          hourlyData[hour] = 0;
        }

        // Aggregate sessions by hour
        todaySessions.forEach(session => {
          const startHour = new Date(session.startTime).getHours();
          const minutes = Math.floor(session.sessionDuration / 60);
          hourlyData[startHour] += minutes;
        });

        // Only show hours with data or around current time
        const currentHour = now.getHours();
        const startHour = Math.max(0, currentHour - 6);
        const endHour = Math.min(23, currentHour + 6);

        for (let hour = startHour; hour <= endHour; hour++) {
          labels.push(`${hour.toString().padStart(2, '0')}:00`);
          data.push(hourlyData[hour]);
        }
      } else {
        // Fallback: just show today's total
        labels.push('Today');
        let minutes = todayStats?.totalMinutes || 0;
        if (selectedTag && todayStats?.tags) {
          minutes = todayStats.tags[selectedTag] || 0;
        }
        data.push(minutes);
      }
    } else if (selectedPeriod === 'week') {
      // Current week - show 7 days of current week
      const startOfWeek = new Date(now);
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday start
      startOfWeek.setDate(diff);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

        const dayStats = productivity.dailyStats[dateStr];
        let minutes = dayStats?.totalMinutes || 0;

        if (selectedTag && dayStats?.tags) {
          minutes = dayStats.tags[selectedTag] || 0;
        }

        data.push(minutes);
      }
    } else if (selectedPeriod === 'month') {
      // Current month - show weeks of current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Find first Monday of the month (or before)
      const firstMonday = new Date(startOfMonth);
      const dayOfWeek = firstMonday.getDay();
      const diff = firstMonday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      firstMonday.setDate(diff);

      let weekStart = new Date(firstMonday);
      let weekNumber = 1;

      while (weekStart <= endOfMonth) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Calculate week key
        const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        const weekKey = `${weekStart.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;

        labels.push(`Week ${weekNumber}`);

        const weekStats = productivity.weeklyStats[weekKey];
        let minutes = weekStats?.totalMinutes || 0;

        if (selectedTag && weekStats?.tags) {
          minutes = weekStats.tags[selectedTag] || 0;
        }

        data.push(minutes);

        weekStart.setDate(weekStart.getDate() + 7);
        weekNumber++;

        // Safety break
        if (weekNumber > 6) break;
      }
    } else {
      // Current year - show 12 months of current year
      const currentYear = now.getFullYear();

      for (let month = 0; month < 12; month++) {
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        const monthDate = new Date(currentYear, month, 1);

        labels.push(monthDate.toLocaleDateString('en-US', { month: 'short' }));

        const monthStats = productivity.monthlyStats[monthKey];
        let minutes = monthStats?.totalMinutes || 0;

        if (selectedTag && monthStats?.tags) {
          minutes = monthStats.tags[selectedTag] || 0;
        }

        data.push(minutes);
      }
    }

    return {
      labels,
      datasets: [{ data }]
    };
  };

  // Get tag distribution data for pie chart
  const getTagDistribution = () => {
    if (!productivity) return [];

    const tagTotals: Record<string, number> = {};

    // Aggregate from current period stats based on selected period
    let statsSource: any[] = [];

    if (selectedPeriod === 'day') {
      // Current day only
      const today = new Date().toISOString().split('T')[0];
      const dayStats = productivity.dailyStats[today];
      if (dayStats) statsSource.push(dayStats);
    } else if (selectedPeriod === 'week') {
      // Current week - 7 days
      const now = new Date();
      const startOfWeek = new Date(now);
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayStats = productivity.dailyStats[dateStr];
        if (dayStats) statsSource.push(dayStats);
      }
    } else if (selectedPeriod === 'month') {
      // Current month - weeks
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const firstMonday = new Date(startOfMonth);
      const dayOfWeek = firstMonday.getDay();
      const diffDays = firstMonday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      firstMonday.setDate(diffDays);

      let weekStart = new Date(firstMonday);
      let weekCount = 0;

      while (weekStart <= endOfMonth && weekCount < 6) {
        const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        const weekKey = `${weekStart.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;

        const weekStats = productivity.weeklyStats[weekKey];
        if (weekStats) statsSource.push(weekStats);

        weekStart.setDate(weekStart.getDate() + 7);
        weekCount++;
      }
    } else {
      // Current year - 12 months
      const currentYear = new Date().getFullYear();
      for (let month = 0; month < 12; month++) {
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        const monthStats = productivity.monthlyStats[monthKey];
        if (monthStats) statsSource.push(monthStats);
      }
    }

    statsSource.forEach((stats: { tags?: Record<string, number> }) => {
      Object.entries(stats.tags || {}).forEach(([tag, minutes]) => {
        if (tag && tag.trim()) {
          tagTotals[tag] = (tagTotals[tag] || 0) + minutes;
        }
      });
    });

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

    return Object.entries(tagTotals)
      .filter(([tag, minutes]) => tag && minutes > 0)
      .map(([tag, minutes], index) => ({
        name: tag,
        population: minutes,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));
  };

  // Generate stat cards
  const getStatCards = (): StatCard[] => {
    if (!productivity) return [];

    const baseCards: StatCard[] = [
      {
        title: 'Time Studied',
        value: `${Math.floor(productivity.timeStudiedToday / 60)}h ${productivity.timeStudiedToday % 60}m`,
        subtitle: 'Today',
        color: '#4ECDC4'
      },
      {
        title: 'Current Streak',
        value: `${productivity.allTimeStats.currentStreak} 🔥`,
        subtitle: 'days',
        color: '#FF6B6B'
      },
      {
        title: 'Total Sessions',
        value: "🔒",
        subtitle: 'Upgrade To Pro',
        color: '#45B7D1'
      },
      {
        title: 'Coins Earned',
        value: "🔒",
        subtitle: 'Upgrade To Pro',
        color: '#FFEAA7'
      }
    ];


    const proCards: StatCard[] = [
      {
        title: 'Total Study Time',
        value: `${Math.floor(productivity.allTimeStats.totalMinutes / 60)}h ${productivity.allTimeStats.totalMinutes % 60}m`,
        subtitle: 'All time',
        color: '#4ECDC4'
      },
      {
        title: 'Current Streak',
        value: `${productivity.allTimeStats.currentStreak} 🔥`,
        subtitle: 'days',
        color: '#FF6B6B'
      },
      {
        title: 'Total Sessions',
        value: `${productivity.allTimeStats.totalSessions}`,
        subtitle: 'completed',
        color: '#45B7D1'
      },
      {
        title: 'Coins Earned',
        value: `${productivity.allTimeStats.totalCoinsEarned}`,
        subtitle: 'from studying',
        color: '#FFEAA7'
      }
    ];

    return isPro ? proCards : baseCards;
  };

  const sortedRecentSessions = useMemo(() => {
    if (!productivity?.recentSessions) return [];
    return [...productivity.recentSessions]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
  }, [productivity?.recentSessions]);

  const chartData = getTimeSeriesData();
  const tagDistribution = getTagDistribution();
  const statCards = getStatCards();

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('@/assets/images/background.webp')}
          style={styles.backgroundImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        <View style={styles.darkOverlay} />
        <ActivityIndicator size="large" color="#B6917E" />
      </View>
    );
  }





  return (
    <>
      <Image
        source={require('@/assets/images/background.webp')}
        style={styles.backgroundImage}
        cachePolicy="memory-disk"
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        style={styles.overlay}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Study Statistics</Text>
            <Text style={styles.subtitle}>Track your progress and productivity</Text>
          </View>

          {/* Time Period Selector */}
          <View style={styles.periodSelector}>
            {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stat Cards */}
          <View style={styles.statsGrid}>
            {statCards.map((card, index) => (
              <View key={index} style={[styles.statCard, { borderLeftColor: card.color }]}>
                <Text style={styles.statValue}>{card.value}</Text>
                <Text style={styles.statTitle}>{card.title}</Text>
                {card.subtitle && <Text style={styles.statSubtitle}>{card.subtitle}</Text>}
              </View>
            ))}
          </View>

          {/* Time Series Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Study Time Trend</Text>
            {isPro ? (
              <LineChart
                data={chartData}
                width={width - 40}
                height={220}
                fromZero={true}
                formatYLabel={(y) => {
                  const yValue = parseFloat(y);
                  const hours = Math.floor(yValue / 60);
                  const mins = Math.round(yValue % 60);

                  if (hours > 0 && mins > 0) {
                    return `${hours}h ${mins}m`;
                  } if (hours > 0) {
                    return `${hours}h`;
                  }
                  return `${mins}m`;
                }}
                formatXLabel={(value) => {
                  if (selectedPeriod === 'day') {
                    return value.split(':')[0];
                  }
                  return value;
                }}
                chartConfig={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backgroundGradientFrom: 'rgba(255, 255, 255, 0.1)',
                  backgroundGradientTo: 'rgba(255, 255, 255, 0.1)',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Changed to black
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#4ECDC4'
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <View style={styles.noChartContainer}>
                <Image
                  source={require('@/assets/images/blurred-line-chart.webp')}
                  style={styles.blurredLineChart}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={styles.upgradePromptContainer}>
                  <Text style={styles.upgradePrompt}>✨ Unlock Detailed Analytics</Text>
                  <Text style={styles.upgradeSubtext}>Upgrade to Pro to track your study trends and patterns</Text>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => router.push('/pro')}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Study Categories</Text>
            {isPro ? (
              <PieChart
                data={tagDistribution}
                width={width - 40}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={styles.chart}
              />
            ) : (
              <View style={styles.noChartContainer}>

                <Image
                  source={require('@/assets/images/blurred-pie-chart.webp')}
                  style={styles.blurredLineChart}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={styles.upgradePromptContainer}>
                  <Text style={styles.upgradePrompt}>✨ Unlock Detailed Analytics</Text>
                  <Text style={styles.upgradeSubtext}>Upgrade to Pro to see how you spend your study time</Text>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => router.push('/pro')}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Recent Sessions */}
          {isPro && (
            <View style={styles.recentSessions}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              <FlatList
                data={sortedRecentSessions}
                keyExtractor={(item) => item.sessionId}
                renderItem={({ item }) => (
                  <View style={styles.sessionItem}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionDate}>
                        {new Date(item.startTime).toLocaleDateString()}
                      </Text>
                      <Text style={styles.sessionTime}>
                        {new Date(item.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionDuration}>
                        {Math.floor(item.sessionDuration / 60)}m {item.sessionDuration % 60}s
                      </Text>
                      {item.tag && (
                        <View style={styles.sessionTag}>
                          <Text style={styles.sessionTagText}>{item.tag}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                scrollEnabled={false}
              />
            </View>
          )}
        </ScrollView>
      </LinearGradient >
    </>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    paddingTop: 60,
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
    fontFamily: 'Quicksand_500Medium',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  periodButtonActive: {
    backgroundColor: 'rgba(255, 245, 230, 0.95)',
  },
  periodButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Quicksand_600SemiBold',
  },
  periodButtonTextActive: {
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: '#4ECDC4',
  },
  tagChipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  tagChipTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statTitle: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  statSubtitle: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  chart: {
    backgroundColor: 'rgb(255, 255, 255)',
    paddingVertical: 16,
    borderRadius: 16,
  },
  recentSessions: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
  },
  sessionTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  sessionDetails: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionTag: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  sessionTagText: {
    color: '#4ECDC4',
    fontSize: 10,
  },
  noChartContainer: {
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 44, 44, 0.2)',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  blurredLineChart: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  upgradePromptContainer: {
    alignItems: 'center',
  },
  centeredUpgradeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 4,
    borderRadius: 12,
  },
  upgradePrompt: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 20,
    color: '#2D1810',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  upgradeSubtext: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
    color: '#FFF5E6',
    marginBottom: 16,
    textAlign: 'center',
    maxWidth: '80%',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  upgradeButton: {
    backgroundColor: 'rgb(158, 118, 160)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(93, 70, 95, 0.63)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  upgradeButtonText: {
    fontFamily: 'Quicksand_700Bold',
    color: '#FFF5E6',
    fontSize: 16,
  },
});