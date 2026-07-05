import { create } from 'zustand';
import { dbService, Transaction } from '../services/db';

interface FinanceState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  loadAllTransactions: () => Promise<void>;
  addTransaction: (newTx: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getSummary: (period: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    income: number;
    expense: number;
    netProfit: number;
    filteredTransactions: Transaction[];
  };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  loadAllTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await dbService.loadTransactions();
      // Sort transactions by date descending (newest first)
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ transactions: sorted, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load transactions', isLoading: false });
    }
  },

  addTransaction: async (txData) => {
    set({ isLoading: true, error: null });
    try {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
      };

      const updated = [newTx, ...get().transactions];
      await dbService.saveTransactions(updated);
      set({ transactions: updated, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to add transaction', isLoading: false });
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const updated = get().transactions.filter(t => t.id !== id);
      await dbService.saveTransactions(updated);
      set({ transactions: updated, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete transaction', isLoading: false });
      throw err;
    }
  },

  getSummary: (period) => {
    const allTxs = get().transactions;
    const now = new Date();
    
    // Filter logic
    const filteredTransactions = allTxs.filter((tx) => {
      const txDate = new Date(tx.date);
      
      if (period === 'DAILY') {
        // Same calendar day
        return (
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      } else if (period === 'WEEKLY') {
        // Last 7 days
        const diffTime = Math.abs(now.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      } else {
        // MONTHLY: Same calendar month and year
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
    });

    // Accumulators
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'INCOME') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });

    const netProfit = income - expense;

    return {
      income,
      expense,
      netProfit,
      filteredTransactions,
    };
  },
}));
export type { Transaction };
