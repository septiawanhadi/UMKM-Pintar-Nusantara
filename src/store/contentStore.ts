import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiService, ProductCategory } from '../services/ai';

export interface Caption {
  id: string;
  text: string;
  style: 'PERSUASIVE' | 'CASUAL' | 'EDUCATIONAL';
}

export interface Product {
  id: string;
  name: string;
  descriptionRaw: string;
  imageUrl: string; // local or remote URL
  generatedCaptions: Caption[];
  suggestedHashtags: string[];
  marketplaceDescription: string;
  createdAt: string;
}

interface ContentState {
  products: Product[];
  latestProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  loadHistory: () => Promise<void>;
  generateContent: (name: string, descriptionRaw: string, imageUrl: string, category: ProductCategory, subCategory?: string) => Promise<Product>;
  clearLatestProduct: () => void;
}

const HISTORY_KEY = '@UPN_CONTENT_HISTORY';

export const useContentStore = create<ContentState>((set, get) => ({
  products: [],
  latestProduct: null,
  isLoading: false,
  error: null,

  loadHistory: async () => {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (data) {
        set({ products: JSON.parse(data) as Product[] });
      }
    } catch (err: any) {
      console.error('Failed to load content history:', err);
    }
  },

  generateContent: async (name, descriptionRaw, imageUrl, category, subCategory) => {
    set({ isLoading: true, error: null });
    try {
      // Call AI Service
      const aiResult = await aiService.generateMarketingContent(name, descriptionRaw, category, subCategory);

      const newProduct: Product = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        descriptionRaw,
        imageUrl,
        generatedCaptions: aiResult.captions,
        suggestedHashtags: aiResult.hashtags,
        marketplaceDescription: aiResult.marketplaceDescription,
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [newProduct, ...get().products];
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      set({ 
        products: updatedHistory,
        latestProduct: newProduct,
        isLoading: false 
      });

      return newProduct;
    } catch (err: any) {
      set({ error: err.message || 'AI generation failed', isLoading: false });
      throw err;
    }
  },

  clearLatestProduct: () => set({ latestProduct: null }),
}));
export type { Caption as ContentCaption };
