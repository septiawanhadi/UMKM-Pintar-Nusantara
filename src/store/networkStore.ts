import { create } from 'zustand';
import { Alert } from 'react-native';

interface NetworkState {
  isOnline: boolean;
  toggleNetwork: () => void;
  setOnline: (status: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,

  toggleNetwork: () => {
    const nextState = !get().isOnline;
    set({ isOnline: nextState });

    if (nextState) {
      console.log('[Network] Connection restored. Synchronizing cached database changes...');
      Alert.alert(
        'Sinkronisasi Berhasil',
        'Koneksi internet pulih. Menyelaraskan catatan transaksi offline ke database cloud...'
      );
    } else {
      console.log('[Network] Connection lost. App running in offline cache mode.');
    }
  },

  setOnline: (status: boolean) => {
    if (get().isOnline !== status) {
      set({ isOnline: status });
      console.log(`[Network] Connection status dynamically updated: ${status ? 'ONLINE' : 'OFFLINE_FALLBACK'}`);
    }
  }
}));
