import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string; // UUID
  date: string; // ISO string representation
  type: 'INCOME' | 'EXPENSE'; // Pemasukan atau Pengeluaran
  description: string; // Deskripsi yang di-parse AI
  amount: number; // Jumlah uang
  category: 'SALES' | 'RAW_MATERIAL' | 'SHIPPING' | 'OTHER'; // Kategori terstruktur
  source: 'VOICE' | 'TEXT' | 'OCR'; // Bagaimana data ini masuk
}

const TRANSACTIONS_KEY = '@UPN_TRANSACTIONS';

export const dbService = {
  /**
   * Load all transactions stored in local AsyncStorage.
   */
  async loadTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      if (data) {
        return JSON.parse(data) as Transaction[];
      }
      return [];
    } catch (error) {
      console.error('Error loading transactions from local storage:', error);
      return [];
    }
  },

  /**
   * Overwrite and save the complete list of transactions.
   */
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions to local storage:', error);
    }
  }
};
