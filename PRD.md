🤖 PRD: UMKM Pintar Nusantara (UPN) \- Build Contract for AI Agent Coders  
 Product/Company: UMKM Pintar Nusantara (UPN) / \[Nama Tim Anda\]  
 App Type: Cross-Platform Mobile Application (Prioritas Android, Target iOS)  
 Industry/Domain: FinTech & Digital Marketing Tools untuk UMKM Indonesia.  
 Brand Personality: Helpful, Reliable, Energetic, Minimalist.  
 Target Users: Pelaku UMKM yang belum mahir digital marketing dan pencatatan manual.

1. Agent Instructions (System Prompt)  
    markdown  
    You are a Senior Full-Stack Mobile Developer specializing in React Native/Flutter (Assume React Native for this build). You are building the core functionality of the "UMKM Pintar Nusantara" application. Follow this PRD section by section EXACTLY. NEVER skip phases or assume logic. Every component must be wired and functional, not just mocked. ALWAYS use the design tokens defined in Section 1 before writing any UI code. If a feature references a specific library (e.g., React Native Paper, Expo ImagePicker), use that exact library. After completing each phase/section, output: "✅ Phase \[N\] complete. Ready for review." Wait for explicit approval before continuing to the next phase.  
2. Brand & Design System (Design Tokens)  
    🎨 Color Tokens  
    Token Name  
    Hex Code  
    Usage Context  
    colorPrimary  
    \#FF6B00 (Oranye Cerah)  
    CTA utama, Header Bar, Highlight AI Output.  
    colorSecondary  
    \#4ECDC4 (Teal/Mint)  
    Indikator sukses, tombol sekunder, highlight fitur.  
    colorBackground  
    \#F7F9FC (Off-White)  
    Latar belakang utama layar.  
    colorSurface  
    \#FFFFFF  
    Kartu konten, modal background.  
    colorTextPrimary  
    \#1A202C (Dark Charcoal)  
    Teks utama body copy.  
    colorTextSecondary  
    \#6B7280 (Medium Gray)  
    Label, deskripsi kecil, placeholder text.  
    colorDanger  
    \#E53E3E (Red)  
    Tombol Hapus/Delete, Error State.

✒️ Typography Tokens  
 Font Family: Inter (Asumsi default RN font).  
 H1 (Screen Title): Size 28px, Weight Bold.  
 Body Large: Size 16px, Weight Regular.  
 Body Small: Size 14px, Weight Regular.  
 Caption/Label: Size 12px, Weight Medium.  
 📏 Spacing & Sizing Tokens  
 Spacing Unit (Base): 8px. Semua padding dan margin harus kelipatan dari 8px (misal: p-4 \= 32px).  
 Border Radius: Default 10px. Untuk tombol utama, gunakan radius yang lebih besar (12px).  
 ✨ Animation Tokens  
 Transition Duration: 300ms.  
 Easing Curve: easeOutCubic.

2. Project Architecture (Tech Stack & Structure)  
    Framework: React Native (Expo Managed Workflow).  
    State Management: Zustand (Simple, fast for MVP).  
    Styling: Styled Components atau Tailwind CSS for RN.  
    AI Integration: Menggunakan API Gateway ke OpenAI/Gemini.  
    Data Persistence: AsyncStorage / Realm DB (untuk caching offline).  
3. Navigation & Global Shell  
    Pattern: Tab Bar Navigator (Bottom Tabs).  
    Routes Utama:  
    HomeTab: Dashboard utama (Ringkasan Cepat).  
    ContentTab: Modul Generator Konten.  
    SalesTab: Modul Respons Chat/Order.  
    FinanceTab: Modul Ledger & Laporan.

4+: Screens Detail (Per Screen Specification)  
 Screen 1: Home Dashboard (HomeTab)  
 Purpose: Memberikan gambaran kesehatan bisnis UMKM secara sekilas.  
 Layout: ScrollView, Header Bar (dengan Logo UPN & Tombol Settings).  
 Sections:  
 Quick Stats Card: Tampilkan 3 metrik utama: Total Penjualan Hari Ini, Jumlah Transaksi Hari Ini, Produk Terlaris (berdasarkan data terakhir).  
 Recent Activity Feed: Daftar 5 aktivitas terbaru (misal: "Baru dicatat pemasukan Rp150rb", "AI menyarankan caption baru untuk Baju Batik").  
 Quick Action Buttons: Tombol pintas menuju fungsi paling sering digunakan: \[+ Foto Produk\]  
 →  
 → (A), \[Chat WA/IG\]  
 →  
 → (B), \[Input Suara Transaksi\]  
 →  
 → (C).  
 Screen 2: Content Generator (ContentTab)  
 Purpose: Membantu UMKM membuat materi promosi digital secara instan.  
 Layout: Form Input di atas, Hasil Output dalam Card View di bawah.  
 Sections:  
 Input Area: \[Camera/Gallery Picker\]  
 →  
 → (FR 1.1). Field teks untuk deskripsi singkat (Placeholder: "Jelaskan produk Anda...").  
 Action Button: Tombol besar Generate Content (mengaktifkan API call).  
 Output Card View: Menampilkan hasil AI dalam kartu terpisah yang dapat di-tap/copy.  
 Card 1: Caption Instagram (dengan tombol Copy)  
 Card 2: Deskripsi Marketplace (dengan tombol Copy)  
 Card 3: Hashtag List (dengan tombol Copy All)  
 Screen 3: Sales Responder (SalesTab)  
 Purpose: Mengelola interaksi pelanggan dan memproses pesanan secara otomatis.  
 Layout: Chat Interface (mirip WhatsApp).  
 Sections:  
 Input Area: Text Input Field \+ Tombol Mikrofon (untuk input suara langsung ke AI).  
 Chat History: Menampilkan riwayat interaksi dengan AI/Pelanggan.  
 Bubble Pelanggan: Teks pertanyaan dari pelanggan.  
 Bubble UPN (AI): Balasan yang dihasilkan AI.  
 Bubble Order Extracted: Jika Modul B berhasil memproses, tampilkan notifikasi terstruktur: "✅ Order Terdeteksi: 3x Baju Batik Merah." dengan tombol \[Simpan ke Ledger\] dan \[Edit Detail\].  
 Screen 4: Finance & Report (FinanceTab)  
 Purpose: Mencatat transaksi secara manual/suara dan melihat ringkasan kinerja.  
 Layout: Tab View di bagian atas (Harian / Mingguan / Bulanan).  
 Sections:  
 Transaction Input Widget: Tombol besar \+ Tambah Transaksi yang memicu modal input suara/teks.  
 Transaction List: Daftar semua transaksi dalam periode yang dipilih, menampilkan: Tanggal, Deskripsi Singkat, Tipe (Pemasukan/Pengeluaran), Jumlah.  
 Summary Card: Menampilkan total ringkasan untuk periode tersebut (Profit Bersih).  
🌐 Global Features (Cross-Cutting Concerns)  
 Feature  
 Modul Terkait  
 Detail Implementasi Wajib  
 Authentication  
 Semua  
 Email/Password via Firebase Auth. Harus ada Sign Up dan Login Screen.  
 Offline Support  
 Semua  
 Data transaksi (Modul C) harus tersimpan di Realm DB lokal saat offline. UI harus menampilkan indikator "Offline Mode: Syncing..." jika koneksi hilang.  
 Real-time Updates  
 Sales Tab  
 Saat pengguna berada di SalesTab, status pesan dari pelanggan yang baru masuk harus muncul secara instan (simulasi Socket/Polling).  
 File Uploads  
 Content Gen, Finance  
 Harus menggunakan expo-image-picker untuk mengambil foto produk atau struk.  
 Analytics  
 Semua  
 Integrasi Firebase Analytics: Track setiap kali pengguna menekan tombol CTA utama di setiap modul.  
📊 Data Schemas & Mock Data (The Blueprint)  
 A. Schema: Transaction (Finance Module)  
 typescript  
 interface Transaction { id: string; // UUID date: Date; type: 'INCOME' | 'EXPENSE'; // Pemasukan atau Pengeluaran description: string; // Deskripsi yang di-parse AI (misal: "Penjualan Keripik") amount: number; // Jumlah uang (harus positif) category: 'SALES' | 'RAW\_MATERIAL' | 'SHIPPING' | 'OTHER'; // Kategori terstruktur source: 'VOICE' | 'TEXT' | 'OCR'; // Bagaimana data ini masuk }  
 B. Schema: Product (Content Module)  
 typescript  
 interface Product { id: string; // UUID name: string; descriptionRaw: string; // Input mentah dari user imageUrl: string; // URL gambar produk generatedCaptions: Caption\[\]; // Array hasil AI suggestedHashtags: string\[\]; // Array hashtag } interface Caption { id: string; text: string; // Teks caption final style: 'PERSUASIVE' | 'CASUAL' | 'EDUCATIONAL'; }  
 C. Schema: Order (Sales Module)  
 typescript  
 interface Order { orderId: string; // ID unik pesanan productId: string; // Foreign Key ke Product quantity: number; variant: string; // Misal: "Merah", "Ukuran L" status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED'; }  
⚙️ Environment Variables (Config)  
 REACT\_NATIVE\_APP\_NAME: "UMKM Pintar Nusantara"  
 API\_BASE\_URL: [https://api.upn-app.com/v1](https://api.upn-app.com/v1) (Placeholder)  
 OPENAI\_MODEL: "gpt-4o" (Direkomendasikan untuk kualitas terbaik)  
 FIREBASE\_PROJECT\_ID: "\[Your Firebase ID\]"  
🏗️ Build Order (Phase-Locked Development Plan)  
 Agent harus menyelesaikan fase ini secara berurutan.  
 Phase 1: Foundation & Auth: Setup Project, Implement Design System Tokens, Buat Screen Login/Signup. (Wajib)  
 Phase 2: Core Finance MVP: Bangun FinanceTab (CRUD Transaksi via Text Input). Pastikan data tersimpan di Realm DB lokal. (Wajib)  
 Phase 3: Content Generation Integration: Implementasi Modul A. Hubungkan ke API AI. Buat Screen 2 dan pastikan copy-paste berfungsi sempurna. (Wajib)  
 Phase 4: Sales Automation MVP: Implementasi Modul B. Fokus pada kemampuan ekstraksi data dari teks chat (FR 2.3). Integrasikan dengan Order Schema. (Wajib)  
 Phase 5: Integration & Polish: Gabungkan semua modul ke dalam Tab Bar Navigator (HomeTab harus menampilkan ringkasan dari Modul C dan A). Implementasi Offline Caching penuh. (Finalisasi MVP)  
❓ Open Questions (Conflict Detection)  
 (Ini adalah detail yang masih perlu dikonfirmasi sebelum coding dimulai, namun kita akan berasumsi jawaban terbaik untuk melanjutkan build.)  
 \[PENDING\] API Endpoint Detail: Apakah ada kebutuhan spesifik selain POST /transactions dan GET /products/{id}? Perlu konfirmasi endpoint untuk batch update order.  
 \[PENDING\] AI Prompting Strategy (Finance): Untuk input suara, apakah kita akan menggunakan System Prompt yang sangat ketat di awal panggilan API, atau kita akan mengandalkan instruksi dalam user message saja? (Asumsi: Gunakan System Prompt Ketat).  
 \[PENDING\] Order Flow: Ketika AI mendeteksi order (Modul B), apakah sistem harus langsung membuat entri Order baru di DB, atau hanya menampilkan notifikasi yang perlu dikonfirmasi manual oleh user sebelum disimpan ke Ledger? (Asumsi: Tampilkan Notif  
 →  
 → User Konfirmasi  
 →  
 → Simpan Order).

1. 

