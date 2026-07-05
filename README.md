# UMKM Pintar Nusantara (UPN)

**UMKM Pintar Nusantara (UPN)** adalah aplikasi mobile lintas-platform (prioritas Android, target iOS) yang dirancang khusus sebagai alat bantu FinTech & Digital Marketing untuk pelaku UMKM di Indonesia. 

Aplikasi ini membantu pemilik usaha mikro, kecil, dan menengah yang belum terbiasa dengan digital marketing serta pencatatan keuangan manual dengan mengintegrasikan kecerdasan buatan (AI Agent).

---

## ✨ Deskripsi & Fitur Utama Aplikasi

**UMKM Pintar Nusantara** dilengkapi dengan berbagai fitur digital modern yang dirancang untuk mendukung operasional bisnis harian secara mandiri dan efisien:

### 1. 🤖 Asisten AI Pintar (Offline-Ready)
*   **Asisten Chat Bisnis**: Fitur tanya jawab seputar bisnis, tips pemasaran, dan ide pengembangan UMKM yang dapat merespon secara natural.
*   **Pengingat Agenda Cerdas**: Secara cerdas mendeteksi perintah pengingat (misalnya: *"Ingatkan besok jam 9 pagi untuk restock barang"*), mem-parsing tanggal dan waktu, serta menyimpannya langsung ke kalender lokal perangkat Android/iOS Anda.
*   **100% Berjalan Lokal**: Menggunakan logika parser lokal yang sangat cepat, handal, dan dapat diakses kapan saja tanpa perlu koneksi internet ataupun kuota API Cloud.

### 2. 📊 Pencatatan Keuangan (Buku Kas)
*   **Ledger Pemasukan & Pengeluaran**: Sistem pencatatan pembukuan harian yang intuitif untuk mendokumentasikan setiap arus kas masuk dan keluar.
*   **Visualisasi Grafik Interaktif**: Grafik garis (*Line Chart*) performa keuangan yang dibangun secara kustom (tanpa library berat eksternal) untuk memantau tren pendapatan secara instan.
*   **Ekspor Data Profesional**: Unduh seluruh riwayat pencatatan kas Anda langsung menjadi file **PDF** atau **Excel (XLSX)** berkualitas tinggi, siap dikirim untuk kebutuhan pembukuan, investor, atau laporan pajak.

### 3. 📸 Pembuat Konten Promosi AI (AI Copywriter)
*   **Generator Caption Multi-Gaya**: Menghasilkan materi promosi media sosial (Instagram) dengan 3 pilihan gaya bahasa: *Persuasif* (menjual), *Santai* (interaktif), dan *Edukasi* (informasi).
*   **Kategori & Spesifikasi Produk**: Dilengkapi dengan grid penentu Kategori Produk (Kuliner, Fashion, Kecantikan, Elektronik, Lainnya) serta input tipe produk spesifik (contoh: *"parfum"*, *"camilan pedas"*, *"laptop"*) agar tulisan promosi menjadi sangat relevan.
*   **Tagar & Deskripsi Toko**: Menghasilkan daftar hashtag populer serta template deskripsi produk marketplace (Shopee, Tokopedia, dll) yang siap salin (*copy-to-clipboard*).

### 4. 🔒 Autentikasi Hibrida & Skalabilitas Offline
*   **Firebase & Local Fallback**: Mendukung masuk/daftar dengan Firebase Authentication secara online, dan otomatis beralih ke sesi penyimpanan lokal (*Mock Mode*) menggunakan AsyncStorage jika perangkat sedang berada di wilayah tanpa sinyal internet.
*   **Offline-First Priority**: Seluruh database keuangan, riwayat konten promosi, dan riwayat obrolan AI disimpan secara lokal di perangkat Anda. Data akan otomatis disinkronkan saat terhubung kembali ke internet.

---

## 🛠️ Tech Stack & Arsitektur

*   **Framework Utama**: [React Native (Expo SDK 57)](https://expo.dev/)
*   **Routing & Navigasi**: [Expo Router](https://docs.expo.dev/router/introduction/) (Folder-based Routing)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Sederhana, ringan, dan cepat)
*   **Styling**: [Styled Components (Native)](https://styled-components.com/)
*   **Penyimpanan Lokal**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) (Persistensi Sesi & Fallback Sesi Mock)
*   **Autentikasi**: [Firebase Authentication](https://firebase.google.com/docs/auth) / Fallback Mock Autentikasi
*   **Ikonografi**: [@expo/vector-icons (Ionicons)](https://icons.expo.fyi/)

---

## 💻 Cara Menjalankan Project Secara Lokal

Ikuti panduan berikut untuk memulai server pengembangan lokal Anda:

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js** (rekomendasi versi >= 20) dan **NPM** di komputer Anda.

### 2. Instalasi Dependensi
Jalankan perintah berikut pada terminal di direktori utama proyek untuk menginstal semua package yang diperlukan:
```bash
npm install
```

### 3. Jalankan Server Development
Mulai server Expo dengan perintah:
```bash
npm run start
```

### 4. Buka Aplikasi
Setelah server aktif, Anda dapat membuka aplikasi melalui beberapa metode:
*   **Web Browser**: Tekan tombol **`w`** di terminal untuk membukanya secara langsung di browser lokal Anda.
*   **Smartphone (Expo Go)**: Instal aplikasi **Expo Go** di HP Android atau iOS Anda. Pastikan HP dan komputer berada di jaringan Wi-Fi yang sama, kemudian pindai (*scan*) QR Code yang ada di terminal Anda.
*   **Emulator**: Tekan **`a`** untuk emulator Android, atau **`i`** untuk simulator iOS.

---

## 🎨 Token Desain (Brand Identity)

Aplikasi ini menggunakan palette warna modern yang harmonis untuk memberikan kesan premium, enerjik, dan bersih:
*   **Primary Accent (`#FF6B00`)**: Oranye Cerah untuk tombol aksi utama, bar navigasi atas, dan AI highlight.
*   **Secondary Accent (`#4ECDC4`)**: Teal/Mint untuk indikator sukses, tombol sekunder, dan fitur pelengkap.
*   **Background (`#F7F9FC`)**: Off-White bersih sebagai latar belakang halaman utama.
*   **Surface (`#FFFFFF`)**: Putih bersih untuk kartu konten, modal, dan elemen form input.
*   **Text Primary (`#1A202C`)**: Charcoal gelap untuk keterbacaan teks utama yang optimal.
*   **Text Secondary (`#6B7280`)**: Abu-abu sedang untuk deskripsi pembantu dan label placeholder.
*   **Danger (`#E53E3E`)**: Merah tegas untuk indikator eror, peringatan, dan tombol hapus.
