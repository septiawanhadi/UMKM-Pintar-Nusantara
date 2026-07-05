import { Product } from '../store/contentStore';

export interface ExtractedIntent {
  type: 'ORDER' | 'FINANCE' | 'REMINDER' | 'QNA' | 'UNKNOWN';
  
  // For ORDER
  orderId?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  variant?: string;
  
  // For FINANCE
  financeType?: 'INCOME' | 'EXPENSE';
  amount?: number;
  description?: string;
  
  // For REMINDER
  reminderTitle?: string;
  reminderDateISO?: string; // ISO date string
  
  // For QNA
  answer?: string;
}

export const chatbotParserService = {
  async processMessage(text: string, availableProducts: Product[]): Promise<ExtractedIntent> {
    // Simulate slight processing delay for Edge AI
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.parseLocally(text, availableProducts);
  },

  parseLocally(text: string, availableProducts: Product[]): ExtractedIntent {
    const lower = text.toLowerCase();
    
    // 1. Check Finance (Pengeluaran / Pemasukan)
    // Keywords: pengeluaran, pemasukan, beli (if not followed by product), bayar, ongkir, listrik, dsb.
    const isFinance = lower.includes('pengeluaran') || lower.includes('pemasukan') || lower.includes('bayar') || lower.includes('ongkir') || lower.includes('listrik') || lower.includes('gaji');
    if (isFinance) {
      const amountMatch = lower.match(/(\d+)(rb|ribu|k)?/);
      if (amountMatch) {
        let amount = parseInt(amountMatch[1]);
        if (amountMatch[2]) amount *= 1000;
        else if (amount < 1000 && amount > 0) amount *= 1000; // heuristic (e.g. "50" -> 50.000)
        
        return {
          type: 'FINANCE',
          financeType: lower.includes('pemasukan') ? 'INCOME' : 'EXPENSE',
          amount,
          description: text,
        };
      }
    }
    
    // 2. Check Reminder (Pengingat / Kalender)
    if (lower.includes('ingatkan') || lower.includes('ingetin') || lower.includes('besok') || lower.includes('lusa') || lower.includes('restock')) {
      const targetDate = new Date();
      if (lower.includes('lusa')) {
        targetDate.setDate(targetDate.getDate() + 2);
      } else {
        // default to tomorrow
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      // Extract custom time if mentioned (e.g., "jam 8", "pukul 15.30")
      const timeMatch = lower.match(/(?:jam|pukul)\s*(\d{1,2})(?:[\.\:](\d{1,2}))?/);
      let hours = 10;
      let minutes = 0;
      
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        if (timeMatch[2]) {
          minutes = parseInt(timeMatch[2]);
        }
      }
      
      targetDate.setHours(hours, minutes, 0, 0); 
      
      let title = 'Pengingat Agenda UMKM';
      if (lower.includes('restock') || lower.includes('stok')) title = 'Waktunya Restock Barang';
      else if (lower.includes('bayar')) title = 'Pengingat Pembayaran';

      return {
        type: 'REMINDER',
        reminderTitle: title,
        reminderDateISO: targetDate.toISOString(),
      };
    }

    // 3. Check Orders (Pesanan Pelanggan)
    const orderKeywords = ['pesan', 'order', 'mau', 'ambil', 'checkout', 'bks', 'bungkus', 'pcs'];
    const hasOrderKeyword = orderKeywords.some(keyword => lower.includes(keyword)) || lower.includes('beli');

    if (hasOrderKeyword) {
      // Extract quantity
      let quantity = 1;
      const qtyRegex = /(?:(\d+)\s*(?:x|pcs|bks|bungkus|buah|unit|lembar|porsi|pasang))|(?:\b(?:beli|pesan|order|ambil|tambah)\s+(\d+)\b)/i;
      const match = lower.match(qtyRegex);
      if (match) {
        const parsedQty = parseInt(match[1] || match[2]);
        if (!isNaN(parsedQty)) quantity = parsedQty;
      }

      // Extract variant
      let variant = 'Standard';
      const sizeMatch = lower.match(/\b(s|m|l|xl|xxl)\b/i);
      const colorMatch = lower.match(/\b(merah|biru|kuning|hijau|hitam|putih|cokelat|abu|pink|oranye)\b/i);
      
      if (sizeMatch && colorMatch) {
        variant = `${colorMatch[1].toUpperCase()} (${sizeMatch[1].toUpperCase()})`;
      } else if (sizeMatch) {
        variant = `Ukuran ${sizeMatch[1].toUpperCase()}`;
      } else if (colorMatch) {
        variant = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1);
      }

      // Match product
      let matchedProduct: Product | undefined;
      for (const prod of availableProducts) {
        const prodNameWords = prod.name.toLowerCase().split(' ');
        const matches = prodNameWords.some(word => word.length > 3 && lower.includes(word));
        if (matches) {
          matchedProduct = prod;
          break;
        }
      }

      // If a product is mentioned, treat as order
      if (matchedProduct || lower.includes('pesan') || lower.includes('order')) {
        return {
          type: 'ORDER',
          orderId: `ord-${Date.now()}`,
          productId: matchedProduct ? matchedProduct.id : 'mock-prod-id',
          productName: matchedProduct ? matchedProduct.name : 'Produk Custom',
          quantity,
          variant,
        };
      }
    }
    
    // 4. Fallback to QNA / Chat Biasa
    return {
      type: 'QNA',
      answer: 'Halo! Saya asisten AI lokal Anda. Saya bisa mencatat Pengeluaran (cth: "catat pengeluaran listrik 50rb"), membuat Pengingat (cth: "ingatkan restock besok"), atau mencatat Pesanan.'
    };
  }
};
