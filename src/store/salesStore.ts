import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatbotParserService, ExtractedIntent } from '../services/chatbotParser';
import { Product } from './contentStore';

export interface ExtractedOrder {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  variant: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED';
}

export interface ChatMessage {
  id: string;
  sender: 'CUSTOMER' | 'AI';
  text: string;
  timestamp: string;
  extractedIntent: ExtractedIntent | null;
  intentConfirmed: boolean;
}

interface SalesState {
  messages: ChatMessage[];
  orders: ExtractedOrder[];
  isLoading: boolean;
  error: string | null;
  loadSalesData: () => Promise<void>;
  sendCustomerMessage: (text: string, availableProducts: Product[]) => Promise<void>;
  confirmIntent: (messageId: string, addTransactionCallback?: (tx: any) => Promise<void>) => Promise<void>;
  confirmOrderOnly: (messageId: string) => Promise<void>;
  updateExtractedOrder: (messageId: string, quantity: number, variant: string) => void;
  clearChatHistory: () => Promise<void>;
}

const MESSAGES_KEY = '@UPN_CHAT_MESSAGES_V2';
const ORDERS_KEY = '@UPN_ORDERS_V2';

export const useSalesStore = create<SalesState>((set, get) => ({
  messages: [],
  orders: [],
  isLoading: false,
  error: null,

  loadSalesData: async () => {
    try {
      const messagesData = await AsyncStorage.getItem(MESSAGES_KEY);
      const ordersData = await AsyncStorage.getItem(ORDERS_KEY);
      
      const loadedMessages = messagesData ? JSON.parse(messagesData) : getInitialMessages();
      const loadedOrders = ordersData ? JSON.parse(ordersData) : [];
      
      set({ 
        messages: loadedMessages, 
        orders: loadedOrders 
      });
    } catch (err) {
      console.error('Failed to load sales data:', err);
    }
  },

  sendCustomerMessage: async (text, availableProducts) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const newCustomerMsg: ChatMessage = {
        id: `msg-${Date.now()}-cust`,
        sender: 'CUSTOMER',
        text,
        timestamp: timeStr,
        extractedIntent: null,
        intentConfirmed: false,
      };

      let updatedMessages = [...get().messages, newCustomerMsg];
      set({ messages: updatedMessages });

      const extracted = await chatbotParserService.processMessage(text, availableProducts);

      if (extracted.type !== 'UNKNOWN' && extracted.type !== 'QNA') {
        newCustomerMsg.extractedIntent = extracted;
        updatedMessages = get().messages.map(m => m.id === newCustomerMsg.id ? newCustomerMsg : m);
        set({ messages: updatedMessages });
      }

      await new Promise(resolve => setTimeout(resolve, 800)); // typing delay simulator
      
      let aiReplyText = 'Halo! Ada yang bisa saya bantu terkait bisnis UMKM Anda hari ini?';
      
      if (extracted.type === 'ORDER') {
        aiReplyText = `Halo Kak! Pesanan untuk *${extracted.quantity}x ${extracted.productName}* (${extracted.variant}) telah terdeteksi. Silakan konfirmasi detail pesanan di bawah ini agar kami dapat mencatatnya langsung ke laporan keuangan Anda.`;
      } else if (extracted.type === 'FINANCE') {
        aiReplyText = `Catatan keuangan terdeteksi: ${extracted.financeType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'} sebesar Rp ${extracted.amount?.toLocaleString('id-ID')}. Apakah Anda ingin menyimpan ini ke buku kas?`;
      } else if (extracted.type === 'REMINDER') {
        let dateStr = '';
        if (extracted.reminderDateISO) {
          const d = new Date(extracted.reminderDateISO);
          dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} jam ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        aiReplyText = `Saya mendeteksi permintaan pengingat: "${extracted.reminderTitle}" pada ${dateStr}. Ingin menyimpannya ke kalender Anda?`;
      } else if (extracted.type === 'QNA') {
        aiReplyText = extracted.answer || 'Tentu, saya bisa bantu menjawab pertanyaan bisnis Anda.';
      }

      const newAiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'AI',
        text: aiReplyText,
        timestamp: timeStr,
        extractedIntent: null,
        intentConfirmed: false,
      };

      updatedMessages = [...get().messages, newAiMsg];
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
      set({ messages: updatedMessages, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to process message', isLoading: false });
    }
  },

  confirmIntent: async (messageId, addTransactionCallback) => {
    const targetMsg = get().messages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.extractedIntent) return;

    try {
      const intent = targetMsg.extractedIntent;
      
      const updatedMessages = get().messages.map((m) => {
        if (m.id === messageId) {
          return { ...m, intentConfirmed: true };
        }
        return m;
      });

      if (intent.type === 'ORDER') {
        const order: ExtractedOrder = {
          orderId: intent.orderId || `ord-${Date.now()}`,
          productId: intent.productId || 'mock-prod-id',
          productName: intent.productName || 'Produk',
          quantity: intent.quantity || 1,
          variant: intent.variant || 'Standard',
          status: 'PROCESSING'
        };
        const updatedOrders = [...get().orders, order];
        await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
        set({ orders: updatedOrders });
      }

      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
      set({ messages: updatedMessages });
    } catch (err) {
      console.error('Failed to confirm intent:', err);
      throw err;
    }
  },

  confirmOrderOnly: async (messageId) => {
    const targetMsg = get().messages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.extractedIntent || targetMsg.extractedIntent.type !== 'ORDER') return;

    try {
      const intent = targetMsg.extractedIntent;
      
      const updatedMessages = get().messages.map((m) => {
        if (m.id === messageId) {
          return { ...m, intentConfirmed: true };
        }
        return m;
      });

      const order: ExtractedOrder = {
        orderId: intent.orderId || `ord-${Date.now()}`,
        productId: intent.productId || 'mock-prod-id',
        productName: intent.productName || 'Produk',
        quantity: intent.quantity || 1,
        variant: intent.variant || 'Standard',
        status: 'PROCESSING'
      };

      const updatedOrders = [...get().orders, order];
      
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

      set({ messages: updatedMessages, orders: updatedOrders });
    } catch (err) {
      console.error('Failed to confirm order only:', err);
      throw err;
    }
  },

  updateExtractedOrder: (messageId, quantity, variant) => {
    const updatedMessages = get().messages.map((m) => {
      if (m.id === messageId && m.extractedIntent && m.extractedIntent.type === 'ORDER') {
        return {
          ...m,
          extractedIntent: {
            ...m.extractedIntent,
            quantity,
            variant,
          }
        };
      }
      return m;
    });

    AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
    set({ messages: updatedMessages });
  },

  clearChatHistory: async () => {
    const initial = getInitialMessages();
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(initial));
    set({ messages: initial });
  }
}));

function getInitialMessages(): ChatMessage[] {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return [
    {
      id: 'init-msg-1',
      sender: 'AI',
      text: 'Halo! Saya adalah Asisten AI Lokal UMKM Pintar Nusantara. Apa yang bisa saya bantu hari ini?\n\nBerikut beberapa hal yang bisa saya lakukan:\n1. 💰 Mencatat Keuangan (Cth: "Catat pengeluaran listrik 50rb")\n2. 📅 Membuat Pengingat (Cth: "Ingatkan besok jam 10 untuk restock barang")\n3. 📦 Mencatat Pesanan (Cth: "Pesan 2x Kemeja Batik ukuran XL")\n\nSilakan ketik pesannya!',
      timestamp: timeStr,
      extractedIntent: null,
      intentConfirmed: false,
    }
  ];
}
