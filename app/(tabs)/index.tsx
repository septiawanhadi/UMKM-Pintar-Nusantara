import React from 'react';
import { ScrollView, StatusBar } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Mock data for quick stats and activities
  const stats = {
    salesToday: 'Rp 1.250.000',
    transactionsToday: 8,
    topProduct: 'Batik Tulis Mega Mendung',
  };

  const activities = [
    { id: '1', text: 'Baru dicatat pemasukan Rp 150rb', time: '10 menit yang lalu', icon: 'cash-outline', color: '#4ECDC4' },
    { id: '2', text: 'AI menyarankan caption baru untuk Baju Batik', time: '1 jam yang lalu', icon: 'sparkles-outline', color: '#FF6B00' },
    { id: '3', text: 'Pesanan baru dari Budi Santoso dideteksi oleh AI', time: '2 jam yang lalu', icon: 'chatbubble-ellipses-outline', color: '#FF6B00' },
    { id: '4', text: 'Laporan bulanan Juni siap diunduh', time: '1 hari yang lalu', icon: 'document-text-outline', color: '#6B7280' },
    { id: '5', text: 'Baru dicatat pengeluaran bahan baku Rp 300rb', time: '2 hari yang lalu', icon: 'cart-outline', color: '#E53E3E' },
  ];

  return (
    <Container>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        
        {/* Welcome Section */}
        <WelcomeSection>
          <GreetingText>Selamat Datang,</GreetingText>
          <UserName>{user?.displayName || 'Pemilik UMKM'}</UserName>
          <UserEmail>{user?.email}</UserEmail>
        </WelcomeSection>

        {/* Quick Stats Section */}
        <SectionTitle>Status Bisnis Hari Ini</SectionTitle>
        <StatsRow>
          <StatCard>
            <StatIconBackground color="#FFF0E6">
              <Ionicons name="cash" size={20} color={theme.colors.primary} />
            </StatIconBackground>
            <StatLabel>Total Penjualan</StatLabel>
            <StatValue>{stats.salesToday}</StatValue>
          </StatCard>

          <StatCard>
            <StatIconBackground color="#E6F9F8">
              <Ionicons name="receipt" size={20} color={theme.colors.secondary} />
            </StatIconBackground>
            <StatLabel>Transaksi</StatLabel>
            <StatValue>{stats.transactionsToday} Kali</StatValue>
          </StatCard>
        </StatsRow>

        <TopProductCard>
          <TopProductIconContainer>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </TopProductIconContainer>
          <TopProductInfo>
            <TopProductLabel>Produk Terlaris</TopProductLabel>
            <TopProductName>{stats.topProduct}</TopProductName>
          </TopProductInfo>
        </TopProductCard>

        {/* Quick Actions */}
        <SectionTitle>Aksi Cepat</SectionTitle>
        <ActionsContainer>
          <ActionButton onPress={() => router.push('/(tabs)/content')}>
            <ActionIconWrapper color="#FF6B00">
              <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
            </ActionIconWrapper>
            <ActionLabel>+ Foto Produk</ActionLabel>
          </ActionButton>

          <ActionButton onPress={() => router.push('/(tabs)/sales')}>
            <ActionIconWrapper color="#4ECDC4">
              <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
            </ActionIconWrapper>
            <ActionLabel>Chat WA/IG</ActionLabel>
          </ActionButton>

          <ActionButton onPress={() => router.push('/(tabs)/finance')}>
            <ActionIconWrapper color="#6B7280">
              <Ionicons name="mic-outline" size={24} color="#FFFFFF" />
            </ActionIconWrapper>
            <ActionLabel>Input Suara</ActionLabel>
          </ActionButton>
        </ActionsContainer>

        {/* Recent Activities */}
        <SectionTitle>Aktivitas Terbaru</SectionTitle>
        <ActivityFeed>
          {activities.map((activity) => (
            <ActivityItem key={activity.id}>
              <ActivityIconContainer color={activity.color}>
                <Ionicons name={activity.icon as any} size={18} color="#FFFFFF" />
              </ActivityIconContainer>
              <ActivityContent>
                <ActivityText>{activity.text}</ActivityText>
                <ActivityTime>{activity.time}</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          ))}
        </ActivityFeed>

      </ScrollView>
    </Container>
  );
}

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const WelcomeSection = styled.View`
  margin-bottom: ${theme.spacing(3)}px;
  background-color: ${theme.colors.surface};
  padding: ${theme.spacing(2.5)}px;
  border-radius: ${theme.borderRadius.default}px;
  border: 1px solid ${theme.colors.border};
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
  background-color: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.default}px;
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px;
  width: 48%;
`;

const StatIconBackground = styled.View<{ color: string }>`
  background-color: ${(props) => props.color};
  width: 36px;
  height: 36px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(1)}px;
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
  background-color: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.default}px;
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px;
  flex-direction: row;
  align-items: center;
`;

const TopProductIconContainer = styled.View`
  background-color: #FFFDF0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  border: 1px solid #FFEAA7;
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
  background-color: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.default}px;
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px 10px;
  width: 31%;
  align-items: center;
  justify-content: center;
`;

const ActionIconWrapper = styled.View<{ color: string }>`
  background-color: ${(props) => props.color};
  width: 44px;
  height: 44px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(1)}px;
`;

const ActionLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  text-align: center;
`;

const ActivityFeed = styled.View`
  background-color: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.default}px;
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px;
`;

const ActivityItem = styled.View`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${theme.spacing(1.5)}px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.background};
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
