import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import XLSX from 'xlsx';
import { Transaction } from '../store/financeStore';

export const exportService = {
  exportToExcel: async (transactions: Transaction[]) => {
    try {
      console.log('[ExportService] Starting Excel export...');
      // 1. Prepare data
      const data = transactions.map(tx => ({
        Tanggal: new Date(tx.date).toLocaleDateString('id-ID'),
        Tipe: tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
        Kategori: tx.category,
        Deskripsi: tx.description,
        Nominal: tx.amount
      }));

      // 2. Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Buku Kas");

      // 3. Write to base64
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      // 4. Save to document file (safer for sharing)
      const uri = FileSystem.documentDirectory + 'Laporan_Keuangan_UMKM.xlsx';
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });

      // 5. Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Bagikan Laporan Excel',
          UTI: 'com.microsoft.excel.xls'
        });
      }
      console.log('[ExportService] Excel export successful');
    } catch (error) {
      console.error('[ExportService] Error exporting to Excel:', error);
      throw error;
    }
  },

  exportToPDF: async (transactions: Transaction[]) => {
    try {
      console.log('[ExportService] Starting PDF export...');
      let income = 0;
      let expense = 0;
      
      const rows = transactions.map(tx => {
        if (tx.type === 'INCOME') income += tx.amount;
        else expense += tx.amount;
        
        return `
          <tr>
            <td>${new Date(tx.date).toLocaleDateString('id-ID')}</td>
            <td>${tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</td>
            <td>${tx.category}</td>
            <td>${tx.description}</td>
            <td style="text-align: right; color: ${tx.type === 'INCOME' ? 'green' : '#e53e3e'};">
              Rp ${tx.amount.toLocaleString('id-ID')}
            </td>
          </tr>
        `;
      }).join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
              h1 { color: #2d3748; text-align: center; margin-bottom: 30px; }
              .summary { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px; 
                background: #f7fafc; 
                padding: 20px; 
                border-radius: 12px; 
                border: 1px solid #e2e8f0;
              }
              .summary-box { text-align: center; }
              .summary-label { font-size: 14px; color: #718096; margin-bottom: 5px; }
              .summary-value { font-size: 18px; font-weight: bold; color: #2d3748; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 12px 15px; text-align: left; font-size: 14px; }
              th { background-color: #4ECDC4; color: white; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
              tr:nth-child(even) { background-color: #f7fafc; }
            </style>
          </head>
          <body>
            <h1>Laporan Buku Kas UMKM</h1>
            <div class="summary">
              <div class="summary-box">
                <div class="summary-label">Total Pemasukan</div>
                <div class="summary-value" style="color: green;">Rp ${income.toLocaleString('id-ID')}</div>
              </div>
              <div class="summary-box">
                <div class="summary-label">Total Pengeluaran</div>
                <div class="summary-value" style="color: #e53e3e;">Rp ${expense.toLocaleString('id-ID')}</div>
              </div>
              <div class="summary-box">
                <div class="summary-label">Saldo Bersih</div>
                <div class="summary-value">Rp ${(income - expense).toLocaleString('id-ID')}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th style="text-align: right;">Nominal</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      
      // Write base64 to document directory to completely avoid Android cache permission issues
      const newUri = FileSystem.documentDirectory + 'Laporan_Keuangan_UMKM.pdf';
      if (base64) {
        await FileSystem.writeAsStringAsync(newUri, base64, {
          encoding: FileSystem.EncodingType.Base64
        });
        console.log('[ExportService] PDF created at:', newUri);
      } else {
        throw new Error('Gagal menghasilkan file PDF (base64 kosong).');
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Bagikan Laporan PDF',
          UTI: 'com.adobe.pdf'
        });
      }
      console.log('[ExportService] PDF export successful');
    } catch (error) {
      console.error('[ExportService] Error exporting to PDF:', error);
      throw error;
    }
  }
};
