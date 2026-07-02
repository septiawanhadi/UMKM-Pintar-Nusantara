import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isMockMode } from '../config/firebase';

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthState {
  user: UserSession | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void; // returns cleanup function for real mode
}

const MOCK_USER_KEY = '@UPN_MOCK_USER';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      if (isMockMode) {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const mockUser: UserSession = {
          uid: 'mock-uid-12345',
          email: email.toLowerCase(),
          displayName: 'Pelaku UMKM Pintar',
        };
        await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
        set({ user: mockUser, isLoading: false });
      } else {
        if (!auth) throw new Error('Firebase Auth not initialized.');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        set({ 
          user: {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
          },
          isLoading: false 
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      if (isMockMode) {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const mockUser: UserSession = {
          uid: `mock-uid-${Date.now()}`,
          email: email.toLowerCase(),
          displayName: name,
        };
        await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
        set({ user: mockUser, isLoading: false });
      } else {
        if (!auth) throw new Error('Firebase Auth not initialized.');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        // Update display name
        await updateProfile(fbUser, { displayName: name });
        
        set({ 
          user: {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: name,
          },
          isLoading: false 
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      if (isMockMode) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await AsyncStorage.removeItem(MOCK_USER_KEY);
        set({ user: null, isLoading: false });
      } else {
        if (!auth) throw new Error('Firebase Auth not initialized.');
        await signOut(auth);
        set({ user: null, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Logout failed', isLoading: false });
      throw err;
    }
  },

  initialize: () => {
    if (isMockMode) {
      // Async storage check for mock session
      AsyncStorage.getItem(MOCK_USER_KEY).then((data) => {
        if (data) {
          try {
            const parsed = JSON.parse(data) as UserSession;
            set({ user: parsed, isInitialized: true });
          } catch {
            set({ isInitialized: true });
          }
        } else {
          set({ isInitialized: true });
        }
      }).catch(() => {
        set({ isInitialized: true });
      });

      // return empty cleanup
      return () => {};
    } else {
      if (!auth) {
        set({ isInitialized: true });
        return () => {};
      }

      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          set({
            user: {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
            },
            isInitialized: true,
          });
        } else {
          set({ user: null, isInitialized: true });
        }
      });

      return unsubscribe;
    }
  },
}));
