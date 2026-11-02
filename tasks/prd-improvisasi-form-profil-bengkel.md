# PRD: Improvisasi UI/UX Formulir Profil "Bengkel Saya" (/dashboard)

## 1. Overview & Latar Belakang

Dasbor pemilik bengkel ([`src/routes/dashboard.tsx`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/routes/dashboard.tsx)) pada tab "Profil Bengkel" merupakan sarana utama bagi pemilik bengkel anggota PPBMR untuk mengelola informasi operasional, layanan, fasilitas, kontak, serta media promosi bengkel mereka.

Meskipun fungsi simpan data dan *autofill* dari Google Maps telah berjalan, antarmuka formulir profil saat ini masih menggunakan input teks dasar yang kurang ergonomis:
- **Layanan Unggulan & Fasilitas** masih berupa `<textarea>` multi-baris polos tanpa validasi satuan, sulit diatur/dihapus, dan tidak ada panduan jenis servis populer.
- **Nomor WhatsApp** meminta pemilik mengetik format URL lengkap (`https://wa.me/62...`) yang sering memicu kesalahan format atau saltik.
- **Akun Media Sosial** berupa input teks mentah tanpa prefix visual `@` atau handle, sehingga pemilik bingung apakah harus memasukkan URL atau username.
- **Wilayah** menggunakan `<select>` HTML standar tanpa sentuhan visual ramah sentuhan.
- **Link Google Maps** belum memberikan umpan balik visual apakah titik koordinat (Latitude & Longitude) berhasil terdeteksi dengan tepat atau belum.
- **Promo Hari Ini** selalu menampilkan input teks meskipun bengkel sedang tidak memiliki promo aktif.
- **Tombol Simpan** berada di bagian paling bawah halaman panjang, memaksa pengguna melakukan *scrolling* jauh setiap kali memperbarui data.

Dokumen PRD ini menetapkan spesifikasi perombakan menyeluruh pada formulir profil bengkel agar interaktif, ramah pengguna (*user-friendly*), modern, serta mematuhi panduan desain resmi PPBMR ([DESIGN.md](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/DESIGN.md)).

---

## 2. Tujuan (Goals)

1. **Ergonomi Input Data Terstruktur**: Mengganti textarea layanan & fasilitas dengan *Interactive Badge Tag Chips* yang dilengkapi tombol saran cepat (*quick presets*).
2. **Kenyamanan Input Kontak & Medsos**: Mengadopsi *Smart Prefix Inputs* untuk nomor WhatsApp (cukup ketik nomor lokal/internasional, otomatis dinormalisasi ke `wa.me`, lengkap dengan tombol uji chat) dan media sosial (Instagram, TikTok, YouTube, Facebook).
3. **Visibilitas Titik Lokasi Peta**: Menyediakan indikator badge status koordinat (Latitude/Longitude) yang terdeteksi secara real-time dari link Google Maps, beserta tombol pintas "Uji Titik di Google Maps".
4. **Visibilitas & Kontrol Promo**: Menyediakan saklar *Toggle ON/OFF* untuk Promo Spesial dengan *Live Preview Banner Card* yang identik dengan tampilan di halaman publik bengkel.
5. **Indikator Kelengkapan & Akses Simpan Cepat**: Menampilkan persentase kelengkapan profil bengkel di bagian atas dan *Sticky Bottom Action Bar* di bagian bawah agar tombol "Simpan Profil" selalu dapat dijangkau tanpa perlu scroll.

---

## 3. Quality Gates

- `npm run lint` — Bebas error ESLint & Prettier (0 error).
- `npm run test` — Seluruh unit test Vitest lulus (23/23 tests).
- `npx tsc --noEmit` — Type-check TypeScript bebas error (0 error).

---

## 4. User Stories & Rincian Fitur

### US-001: Indikator Kelengkapan Profil & Sticky Save Bar
**Sebagai** pemilik bengkel,  
**Saya ingin** mengetahui seberapa lengkap informasi profil bengkel saya dan dapat menyimpan perubahan kapan saja dengan mudah,  
**Agar** bengkel saya tampil maksimal dan profesional di mata calon pelanggan PPBMR.

**Acceptance Criteria:**
- Di bagian atas formulir terdapat bar indikator progress: `Profil Lengkap: X%` dengan status kelengkapan data kunci (Nama, Alamat, Logo, Layanan, Kontak, Jam Buka).
- Di bagian bawah layar terdapat bar aksi melayang (*Sticky Bottom Bar*) yang menampilkan status perubahan dan tombol simpan utama:
  - Tombol **"Simpan Perubahan"** (dengan animasi loading saat menyimpan).
  - Tombol **"Lihat Halaman Publik"** yang membuka tab baru menuju `/bengkel/[slug]`.

---

### US-002: Segmented Radio Wilayah & Indikator Koordinat Maps
**Sebagai** pemilik bengkel,  
**Saya ingin** memilih wilayah operasional bengkel secara visual dan memastikan link Google Maps yang saya masukkan berhasil mendeteksi titik koordinat dengan akurat,  
**Agar** pelanggan tidak tersesat saat mengklik rute arah di aplikasi.

**Acceptance Criteria:**
- Bidang wilayah menggunakan *Segmented Radio Cards* untuk: `Kota Malang`, `Kabupaten Malang`, dan `Kota Batu`.
- Pada input Link Google Maps:
  - Tersedia tombol **"Isi Otomatis"** yang mengekstrak data dari Google Business Profile.
  - Tampil kotak status deteksi koordinat secara langsung:
    - Jika koordinat valid: badge hijau *"Koordinat Terdeteksi: Lat X, Lng Y"* dan tombol *"Buka Titik Peta"*.
    - Jika link belum berisi titik koordinat: badge peringatan amber meminta menempel link tempat Google Maps yang panjang atau klik isi otomatis.

---

### US-003: Interactive Tag Chips untuk Layanan & Fasilitas
**Sebagai** pemilik bengkel,  
**Saya ingin** menambahkan layanan spesialisasi dan fasilitas bengkel dengan cepat menggunakan saran populer atau mengetik sendiri,  
**Agar** saya tidak perlu mengetik satu per satu dari nol dan formatnya rapi sebagai label tag.

**Acceptance Criteria:**
- **Layanan Unggulan**:
  - Tombol saran cepat 1-klik untuk servis umum di Malang: `Ganti Oli`, `Tune Up Mesin`, `Spooring & Balancing`, `Servis AC`, `Perbaikan Kaki-kaki`, `Overhaul Mesin`, `Kelistrikan & Audio`, `Rem & Kopling`, `Cat & Body Repair`.
  - Input teks dengan tombol `+ Tambah` atau tekan `Enter` untuk menambah layanan khusus.
  - Setiap layanan tampil sebagai *chip badge* dengan tombol `x` untuk menghapus.
- **Fasilitas & Keuntungan Pelanggan**:
  - Tombol saran cepat 1-klik: `Garansi Servis`, `Ruang Tunggu Ber-AC`, `Free Wi-Fi`, `Ruang Tunggu Merokok`, `Musholla Nyaman`, `Kopi & Teh Gratis`, `Gratis Cek 20 Titik Kendaraan`, `Antar-Jemput Kendaraan`.
  - Setiap item tampil sebagai *chip badge* interaktif.
- Data disimpan ke dalam array database `text[]` tanpa memutus kompatibilitas yang sudah ada.

---

### US-004: Smart Normalisasi Kontak WhatsApp & Akun Medsos
**Sebagai** pemilik bengkel,  
**Saya ingin** memasukkan nomor WhatsApp dan akun media sosial tanpa ribet memikirkan format link URL,  
**Agar** calon pelanggan dapat langsung menghubungi bengkel via chat atau melihat portofolio di medsos.

**Acceptance Criteria:**
- **WhatsApp**:
  - Input dilengkapi prefix visual `+62` atau lambang WhatsApp.
  - Pengguna bebas mengetik format lokal `0812...`, format internasional `62812...`, atau nomor dengan tanda strip.
  - Sistem otomatis membersihkan dan menyimpan sebagai URL standar `https://wa.me/62...`.
  - Disediakan tombol **"Tes Chat WA"** yang membuka chat WhatsApp langsung ke nomor tersebut untuk memastikan nomor aktif.
- **Media Sosial**:
  - Instagram: Prefix `instagram.com/` (cukup masukkan username / handle).
  - TikTok: Prefix `tiktok.com/@`.
  - YouTube: Prefix `youtube.com/@`.
  - Facebook: Prefix `facebook.com/`.
  - Website: Prefix `https://`.
  - Jika pengguna menempel link utuh (misal `https://instagram.com/bengkel.ku`), sistem secara cerdas mengekstrak handle/link yang tepat secara otomatis.

---

### US-005: Preset Jam Operasional Fleksibel
**Sebagai** pemilik bengkel,  
**Saya ingin** mengatur jadwal jam operasional dengan cepat menggunakan jadwal yang sering dipakai bengkel di Malang Raya,  
**Agar** saya tidak perlu mengetik panjang secara manual.

**Acceptance Criteria:**
- Input fleksibel dilengkapi tombol pill *quick preset*:
  - `Senin - Sabtu: 08.00 - 17.00`
  - `Setiap Hari: 08.00 - 17.00`
  - `Senin - Jumat: 08.00 - 16.00, Sabtu: 08.00 - 14.00`
  - `24 Jam (Layanan Darurat)`
- Mengklik preset langsung mengisi input, dan pemilik bengkel tetap bebas menyesuaikan teks jam sesuai kebutuhan operasionalnya.

---

### US-006: Toggle Promo Aktif & Live Banner Preview
**Sebagai** pemilik bengkel,  
**Saya ingin** mengaktifkan atau menonaktifkan program promo hari ini dengan saklar sederhana dan melihat pratinjau tampilannya secara langsung,  
**Agar** promo yang saya tawarkan terlihat menarik dan tidak tampil kosong saat bengkel sedang tidak ada promo.

**Acceptance Criteria:**
- Switch toggle: **"Aktifkan Promo Spesial Hari Ini"** (ON / OFF).
- Jika OFF: field input promo disembunyikan dan data promo disimpan sebagai `null`.
- Jika ON:
  - Tampil input **Judul Promo** (misal: "Diskon 20% Tune Up & Cek Rem Gratis!").
  - Tampil input **Rincian Promo** (syarat & ketentuan).
  - Tampil **Live Preview Banner** oranye (warna `signal` PPBMR) yang persis sama dengan tampilan promo di halaman profil publik bengkel.

---

## 5. Non-Functional Requirements (NFR)

1. **Kompatibilitas Skema Database**: Tidak ada perubahan kolom tabel database `workshops` yang merusak data lama (`services` dan `benefits` tetap berupa array `text[]`, kolom lain tetap sesuai skema yang ada).
2. **Aksesibilitas (A11y)**: Setiap input dilengkapi label yang jelas, kontras warna teks dan ikon sesuai standar WCAG AA (antislop-human), dan target klik minimal 36px di desktop / 44px di mobile.
3. **Performa Responsif**: Manipulasi tag chips dan input normalisasi berjalan 100% di sisi klien secara instan tanpa re-render yang membebani browser.

---

## 6. Out of Scope

- Integrasi pembayaran langganan fitur promo.
- Pembuatan voucher digital atau kode kupon diskon unik.

