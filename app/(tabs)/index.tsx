import React, { useEffect } from 'react';
import { ScrollView, StatusBar, Switch, View } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/authStore';
import { useFinanceStore } from '../../src/store/financeStore';
import { useContentStore } from '../../src/store/contentStore';
import { useSalesStore } from '../../src/store/salesStore';
import { useNetworkStore } from '../../src/store/networkStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BackgroundGlows from '../../src/components/BackgroundGlows';
import LineChart, { LineChartData } from '../../src/components/LineChart';

interface ActivityItemType {
  id: string;
  text: string;
  time: Date;
  icon: string;
  color: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { transactions, loadAllTransactions } = useFinanceStore();
  const { products, loadHistory } = useContentStore();
  const { orders, loadSalesData } = useSalesStore();
  const { isOnline, toggleNetwork } = useNetworkStore();

  // Load all store data on mount
  useEffect(() => {
    loadAllTransactions();
    loadHistory();
    loadSalesData();
  }, []);

  // 1. Calculate Today's Stats
  const now = new Date();
  const todayTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      txDate.getDate() === now.getDate() &&
      txDate.getMonth() === now.getMonth() &&
      txDate.getFullYear() === now.getFullYear()
    );
  });

  const totalSalesTodayVal = todayTransactions
    .filter(tx => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSalesToday = 'Rp ' + totalSalesTodayVal.toLocaleString('id-ID');
  const transactionsCountToday = todayTransactions.length;

  // 2. Determine Top Selling Product
  let topProduct = 'Belum ada penjualan';
  if (orders.length > 0) {
    const productCounts: Record<string, number> = {};
    orders.forEach((order) => {
      productCounts[order.productName] = (productCounts[order.productName] || 0) + order.quantity;
    });

    let maxCount = 0;
    Object.entries(productCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topProduct = name;
      }
    });
  } else if (products.length > 0) {
    topProduct = products[0].name; // Default to last created product if no orders confirmed yet
  }

  // 3. Calculate Chart Data (Last 7 Days)
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const financeChartData: BarChartData[] = last7Days.map(date => {
    const dayTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getDate() === date.getDate() && txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
    });
    const income = dayTransactions.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0);
    const expense = dayTransactions.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0);
    return {
      label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      value1: income,
      value2: expense
    };
  });

  const contentChartData: BarChartData[] = last7Days.map(date => {
    const dayContent = products.filter(p => {
      const pDate = new Date(p.createdAt);
      return pDate.getDate() === date.getDate() && pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
    }).length;
    return {
      label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      value1: dayContent
    };
  });

  // 4. Compile Real Recent Activities Timeline (Top 5)
  const compiledActivities: ActivityItemType[] = [];

  // Add real transactions to feed
  transactions.slice(0, 3).forEach((tx) => {
    const amtStr = 'Rp ' + tx.amount.toLocaleString('id-ID');
    const isIncome = tx.type === 'INCOME';
    compiledActivities.push({
      id: `act-tx-${tx.id}`,
      text: `Baru dicatat ${isIncome ? 'pemasukan' : 'pengeluaran'} ${tx.description} sebesar ${amtStr}`,
      time: new Date(tx.date),
      icon: isIncome ? 'cash-outline' : 'cart-outline',
      color: isIncome ? theme.colors.secondary : theme.colors.danger,
    });
  });

  // Add real content generations to feed
  products.slice(0, 2).forEach((prod) => {
    compiledActivities.push({
      id: `act-prod-${prod.id}`,
      text: `AI sukses membuat materi promosi untuk "${prod.name}"`,
      time: new Date(prod.createdAt),
      icon: 'sparkles-outline',
      color: theme.colors.primary,
    });
  });

  // Add real orders to feed
  orders.slice(0, 2).forEach((order) => {
    compiledActivities.push({
      id: `act-ord-${order.orderId}`,
      text: `Pesanan terdaftar: ${order.quantity}x ${order.productName} (${order.variant})`,
      time: new Date(), // Simulating recent
      icon: 'cube-outline',
      color: '#3182CE',
    });
  });

  // Sort timeline chronologically (newest first)
  const activities = compiledActivities
    .sort((a, b) => b.time.getTime() - a.time.getTime());

  // Time formatter helper
  const formatTimeAgo = (date: Date) => {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <BackgroundGlows />

      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <OfflineBanner>
          <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <OfflineBannerText>Mode Offline: Menyinkronkan...</OfflineBannerText>
        </OfflineBanner>
      )}

      <ScrollView contentContainerStyle={{ padding: theme.spacing(2), paddingBottom: 100 }}>
        
        {/* Welcome Card & Network Switch */}
        <WelcomeSection>
          <WelcomeHeader>
            <View>
              <GreetingText>Selamat Datang,</GreetingText>
              <UserName>{user?.displayName || 'Pemilik UMKM'}</UserName>
              <UserEmail>{user?.email}</UserEmail>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <NetworkLabel>{isOnline ? 'Online' : 'Offline'}</NetworkLabel>
              <Switch 
                value={isOnline}
                onValueChange={toggleNetwork}
                trackColor={{ false: theme.colors.border, true: '#E6F9F8' }}
                thumbColor={isOnline ? theme.colors.secondary : theme.colors.danger}
              />
            </View>
          </WelcomeHeader>
        </WelcomeSection>

        {/* Quick Stats Section */}
        <SectionTitle>Status Bisnis Hari Ini</SectionTitle>
        <StatsRow>
          <StatCard>
            <StatIconBackground color="#FFF0E6">
              <Ionicons name="cash" size={20} color={theme.colors.primary} />
            </StatIconBackground>
            <StatLabel>Total Penjualan</StatLabel>
            <StatValue>{totalSalesToday}</StatValue>
          </StatCard>

          <StatCard>
            <StatIconBackground color="#E6F9F8">
              <Ionicons name="receipt" size={20} color={theme.colors.secondary} />
            </StatIconBackground>
            <StatLabel>Transaksi</StatLabel>
            <StatValue>{transactionsCountToday} Kali</StatValue>
          </StatCard>
        </StatsRow>

        <TopProductCard>
          <TopProductIconContainer>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </TopProductIconContainer>
          <TopProductInfo>
            <TopProductLabel>Produk Terlaris</TopProductLabel>
            <TopProductName numberOfLines={1}>{topProduct}</TopProductName>
          </TopProductInfo>
        </TopProductCard>

        {/* Charts Section */}
        <SectionTitle>Tren Keuangan (7 Hari)</SectionTitle>
        <LineChart 
          title="Tren Keuangan (7 Hari)"
          data={financeChartData}
          color1={theme.colors.secondary} // Income
          color2={theme.colors.danger}    // Expense
        />

        <LineChart 
          title="Produktivitas Konten AI (7 Hari)"
          data={contentChartData}
          color1={theme.colors.primary}
        />

        {/* Quick Actions */}
        <SectionTitle>Aksi Cepat</SectionTitle>
        <ActionsContainer>
          <ActionButton onPress={() => router.push('/(tabs)/content')}>
            <ActionIconWrapper color="#FF6B00">
              <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
            </ActionIconWrapper>
            <ActionLabel>Foto Produk AI</ActionLabel>
          </ActionButton>

          <ActionButton onPress={() => router.push('/(tabs)/sales')}>
            <ActionIconWrapper color="#4ECDC4">
              <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
            </ActionIconWrapper>
            <ActionLabel>Asisten AI</ActionLabel>
          </ActionButton>

          <ActionButton onPress={() => router.push('/(tabs)/finance')}>
            <ActionIconWrapper color="#3182CE">
              <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
            </ActionIconWrapper>
            <ActionLabel>Buku Kas</ActionLabel>
          </ActionButton>
        </ActionsContainer>

        {/* Recent Activities Feed */}
        <SectionTitle>Aktivitas Terbaru</SectionTitle>
        <ActivityFeed nestedScrollEnabled={true}>
          {activities.length === 0 ? (
            <EmptyTimeline>
              <Ionicons name="time-outline" size={24} color={theme.colors.textSecondary} />
              <EmptyTimelineText>Belum ada catatan aktivitas baru.</EmptyTimelineText>
            </EmptyTimeline>
          ) : (
            activities.map((activity) => (
              <ActivityItem key={activity.id}>
                <ActivityIconContainer color={activity.color}>
                  <Ionicons name={activity.icon as any} size={16} color="#FFFFFF" />
                </ActivityIconContainer>
                <ActivityContent>
                  <ActivityText>{activity.text}</ActivityText>
                  <ActivityTime>{formatTimeAgo(activity.time)}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))
          )}
        </ActivityFeed>

      </ScrollView>
    </Container>
  );
}

// Styled Components
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const OfflineBanner = styled.View`
  background-color: ${theme.colors.danger};
  height: 38px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-horizontal: 16px;
`;

const OfflineBannerText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
`;

const WelcomeSection = styled.View`
  margin-bottom: ${theme.spacing(3)}px;
  background-color: ${theme.colors.cardBg};
  padding: ${theme.spacing(2.5)}px;
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  ${theme.glassShadow}
`;

const WelcomeHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const GreetingText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.textSecondary};
`;

const UserName = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 22px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-top: 2px;
`;

const UserEmail = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.caption.fontSize}px;
  color: ${theme.colors.textSecondary};
  margin-top: 4px;
`;

const NetworkLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 10px;
  font-weight: 700;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const SectionTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-top: ${theme.spacing(2.5)}px;
  margin-bottom: ${theme.spacing(1.5)}px;
`;

const StatsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${theme.spacing(2)}px;
`;

const StatCard = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px;
  width: 48%;
  ${theme.glassShadow}
`;

const StatIconBackground = styled.View<{ color: string }>`
  background-color: ${(props) => props.color === '#FFF0E6' ? 'rgba(255, 107, 0, 0.15)' : 'rgba(0, 229, 255, 0.15)'};
  width: 36px;
  height: 36px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(1)}px;
  border-width: 1px;
  border-color: ${(props) => props.color === '#FFF0E6' ? 'rgba(255, 107, 0, 0.25)' : 'rgba(0, 229, 255, 0.25)'};
`;

const StatLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.caption.fontSize}px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const StatValue = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 18px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const TopProductCard = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px;
  flex-direction: row;
  align-items: center;
  ${theme.glassShadow}
`;

const TopProductIconContainer = styled.View`
  background-color: rgba(255, 215, 0, 0.12);
  width: 44px;
  height: 44px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 215, 0, 0.25);
  margin-right: ${theme.spacing(2)}px;
`;

const TopProductInfo = styled.View`
  flex: 1;
`;

const TopProductLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.caption.fontSize}px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 2px;
`;

const TopProductName = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const ActionsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${theme.spacing(1)}px;
`;

const ActionButton = styled.TouchableOpacity`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px 10px;
  width: 31%;
  align-items: center;
  justify-content: center;
  ${theme.glassShadow}
`;

const ActionIconWrapper = styled.View<{ color: string }>`
  background-color: ${(props) => props.color === '#FF6B00' ? 'rgba(255, 107, 0, 0.15)' : props.color === '#4ECDC4' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(49, 130, 206, 0.15)'};
  width: 44px;
  height: 44px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(1)}px;
  border-width: 1px;
  border-color: ${(props) => props.color === '#FF6B00' ? 'rgba(255, 107, 0, 0.25)' : props.color === '#4ECDC4' ? 'rgba(0, 229, 255, 0.25)' : 'rgba(49, 130, 206, 0.25)'};
`;

const ActionLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  text-align: center;
`;

const ActivityFeed = styled.ScrollView`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px;
  max-height: 380px;
  ${theme.glassShadow}
`;

const EmptyTimeline = styled.View`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing(3)}px;
`;

const EmptyTimelineText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.textSecondary};
  margin-top: 6px;
`;

const ActivityItem = styled.View`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${theme.spacing(1.5)}px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.05);
`;

const ActivityIconContainer = styled.View<{ color: string }>`
  background-color: ${(props) => props.color};
  width: 32px;
  height: 32px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  margin-right: ${theme.spacing(1.5)}px;
`;

const ActivityContent = styled.View`
  flex: 1;
`;

const ActivityText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.textPrimary};
  line-height: 18px;
`;

const ActivityTime = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  margin-top: 2px;
`;

