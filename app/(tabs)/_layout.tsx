import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/authStore';

export default function TabLayout() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err: any) {
              Alert.alert('Gagal Keluar', err.message || 'Terjadi kesalahan.');
            }
          }
        }
      ]
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 66,
          borderRadius: 33,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          backgroundColor: 'rgba(11, 16, 29, 0.85)',
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        },
        headerStyle: {
          backgroundColor: '#0B101D',
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily,
          fontSize: 18,
          fontWeight: '700',
          color: '#FFFFFF',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          headerTitle: 'UMKM Pintar Nusantara',
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.danger} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Konten AI',
          headerTitle: 'AI Content Generator',
          tabBarLabel: 'Konten AI',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Penjualan',
          headerTitle: 'Sales Responder',
          tabBarLabel: 'Penjualan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Keuangan',
          headerTitle: 'Ledger & Laporan',
          tabBarLabel: 'Keuangan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
