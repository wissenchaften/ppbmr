# PRD: Redesain UI/UX Halaman Utama / Daftar Bengkel (/index.tsx)

## 1. Overview & Latar Belakang

Halaman Utama ([`src/routes/index.tsx`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/routes/index.tsx)) adalah beranda dan etalase utama dari seluruh ekosistem **PPBMR (Paguyuban Pengusaha Bengkel Mobil Malang Raya)**. Halaman ini menjadi titik temu pertama antara pemilik kendaraan bermotor (calon pelanggan) dan puluhan bengkel resmi terpercaya di wilayah Malang Raya (Kota Malang, Kabupaten Malang, dan Kota Batu).

### Permasalahan UI/UX Saat Ini:
1. **Hero & Proposisi Nilai Terlalu Sederhana**: Pengunjung baru yang baru pertama kali membuka website seringkali tidak langsung paham apa itu PPBMR, mengapa bengkel di sini terpercaya, dan apa jaminan kualitasnya dibandingkan bengkel umum di pinggir jalan.
2. **Pencarian & Filter Terbatas**: Pengguna hanya bisa mencari lewat satu kotak teks dan memilih 1 wilayah. Tidak ada filter layanan spesifik (seperti Servis AC, Ganti Oli, Spooring, Overhaul) dan tidak ada filter promo spesial.
3. **Kartu Bengkel Minim Aksi Cepat**: Kartu bengkel saat ini hanya menampilkan nama, alamat, jam, dan list layanan tanpa batasan panjang. Belum ada tombol aksi langsung seperti WhatsApp untuk booking atau konsultasi cepat, serta belum menonjolkan promo aktif bengkel.
4. **Interaksi Peta di Perangkat Mobile**: Di layar ponsel, peta Google Maps tertanam di bawah daftar panjang yang melelahkan untuk dijangkau, atau mengganggu *scroll gesture* pengguna.
5. **Ketiadaan Konten Pendukung di Bagian Bawah**: Setelah daftar bengkel berakhir, halaman langsung terputus tanpa ada edukasi otomotif (padahal sistem artikel PPBMR sudah aktif), tanpa penjelasan profil paguyuban PPBMR, serta tidak ada *Call to Action* (CTA) bagi bengkel di Malang Raya yang ingin bergabung.

Dokumen PRD ini menetapkan spesifikasi komprehensif untuk merombak total UI/UX halaman utama menjadi portal direktori modern, informatif, dan memiliki konversi aksi yang tinggi, sejalan dengan panduan resmi [DESIGN.md](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/DESIGN.md).

---

## 2. Tujuan (Goals) & Metrik Keberhasilan

1. **Memperjelas Identitas & Kepercayaan Portal**: Pengguna dalam 3 detik pertama langsung mengerti bahwa portal ini adalah jaringan resmi bengkel terstandarisasi di Malang Raya dengan 3 pilar kepercayaan (Terverifikasi Resmi, Teknisi Berpengalaman, Bergaransi).
2. **Meningkatkan Kecepatan Temu Layanan**: Pengunjung dapat menemukan bengkel yang relevan dalam < 10 detik menggunakan *Filter Multi-Dimensi* (Wilayah + Counter, Layanan Populer, dan Filter Promo Aktif).
3. **Mendorong Interaksi Cepat (Conversion)**: Menyediakan tombol 1-klik WhatsApp dengan pesan pembuka otomatis, tombol Rute Navigasi Google Maps terverifikasi, dan tombol Lihat Profil & Benefit.
4. **Responsif & Ergonomis di Mobile**: Memberikan pengalaman navigasi peta vs daftar yang mulus di perangkat mobile melalui *Floating Toggle Bar*.
5. **Membangun Ekosistem Terpadu**: Menampilkan artikel edukasi otomotif terkini, profil keunggulan PPBMR, dan banner ajakan bergabung bagi pemilik bengkel baru.

---

## 3. Quality Gates

- `npm run lint` — 0 error ESLint & Prettier.
- `npm run test` — Seluruh unit test Vitest lulus (saat ini 37/37 tests).
- `npx tsc --noEmit` — 0 error kompilasi TypeScript.

---

## 4. User Stories & Spesifikasi Fitur

### US-001: Hero Section Terpadu & 3 Pilar Kepercayaan (Trust Pillars)
**Sebagai** pemilik mobil di Malang Raya,  
**Saya ingin** disambut dengan hero section yang informatif dan menjelaskan kredibilitas bengkel anggota PPBMR,  
**Agar** saya merasa tenang dan yakin mempercayakan perbaikan mobil saya ke bengkel-bengkel yang terdaftar.

**Acceptance Criteria:**
- **Headline & Value Statement**: 
  - Sub-badge: `"PAGUYUBAN RESMI PPBMR"` (background `bg-signal/20 text-signal-light` atau `bg-signal text-white`).
  - Judul: `"Direktori Resmi Bengkel Mobil Terpercaya se-Malang Raya"`.
  - Deskripsi: Penjelasan ringkas bahwa seluruh bengkel telah diverifikasi standar kelayakan peralatan dan kualifikasi teknisi.
- **3 Pilar Kepercayaan (Trust Badges)**:
  1. 🛡️ **Terverifikasi Resmi PPBMR**: Standarisasi legalitas, etika bengkel, dan kelayakan alat kerja.
  2. 🔧 **Teknisi Berpengalaman**: Dikerjakan mekanik profesional dengan jam terbang tinggi dan keahlian spesifik.
  3. 📍 **Navigasi Presisi & Respons Cepat**: Rute akurat via Google Maps dan kontak WhatsApp langsung ke admin/front-office bengkel.
- **Quick Search Box Terintegrasi**: Kotak pencarian utama diletakkan strategis di bawah pilar kepercayaan, dilengkapi ikon pencarian, tombol *clear*, dan placeholder dinamis.

---

### US-002: Multi-Dimensi Search & Filter Cerdas
**Sebagai** pengguna yang membutuhkan perawatan tertentu (misal: servis AC atau mencari bengkel yang ada diskon),  
**Saya ingin** menyaring daftar bengkel berdasarkan wilayah, jenis spesialisasi layanan, dan promo aktif,  
**Agar** saya tidak perlu memeriksa satu per satu puluhan bengkel.

**Acceptance Criteria:**
- **Pills Wilayah dengan Counter Dinamis**:
  - `Semua (X)`, `Kota Malang (Y)`, `Kabupaten Malang (Z)`, `Kota Batu (W)`.
  - Angka counter dihitung real-time dari data bengkel yang tersedia.
- **Quick Service Chips (Layanan Populer)**:
  - Tombol chip horizontal untuk layanan yang paling sering dicari:
    - `Semua Layanan`, `Ganti Oli`, `Tune Up`, `Servis AC`, `Kaki-kaki`, `Spooring & Balancing`, `Overhaul Mesin`, `Cat & Body Repair`, `Emergency 24 Jam`.
  - Klik salah satu chip langsung memfilter bengkel yang memiliki tag layanan tersebut.
- **Toggle Filter Promo Spesial**:
  - Tombol chip khusus `Hanya Promo Spesial` dengan aksen oranye/signal dan ikon tag promo (`Tag` / `Sparkles`).
  - Bila aktif, hanya bengkel yang memiliki `promo_title` aktif yang ditampilkan.
- **Status Hasil & Reset Cepat**:
  - Menampilkan ringkasan: *"Menampilkan X bengkel di [Wilayah]"*.
  - Jika filter aktif dan hasil 0, tampilkan pesan ramah dan tombol *"Reset Semua Filter"*.

---

### US-003: Kartu Bengkel Informatif & Aksi Cepat (Workshop Card)
**Sebagai** calon pelanggan bengkel,  
**Saya ingin** melihat ringkasan fasilitas penting, promo yang sedang berlaku, serta dapat langsung menghubungi atau mencari rute dalam 1 klik,  
**Agar** proses mencari bantuan teknis menjadi instan tanpa berbelit-belit.

**Acceptance Criteria:**
- **Header & Identitas**:
  - Logo bengkel dengan fall-back inisial yang rapi ([`WorkshopLogo`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/WorkshopLogo.tsx)).
  - Nama Bengkel tebal, disertai lencana status **"Anggota Resmi PPBMR"** (badge centang perisai).
  - Alamat lengkap dan pill wilayah.
- **Banner Mini Promo Aktif**:
  - Jika bengkel memiliki `promo_title`, tampilkan pita/badge oranye kontras: `🏷️ Promo: [Judul Promo]`.
- **Informasi Operasional & Fasilitas**:
  - Jam Buka (dengan ikon jam) dan Nomor Telepon.
  - Tag layanan dibatasi maksimal 4 tag pertama, dan jika lebih dari 4 tampilkan badge ringkas `+X lainnya`.
- **Bar Tombol Aksi Cepat (Quick Action Bar)**:
  - 💬 **WhatsApp**: Tombol hijau/outline dengan link `https://wa.me/[phone]?text=...` (pesan otomatis: *"Halo [Nama Bengkel], saya menemukan informasi bengkel Anda di Portal PPBMR..."*).
  - 🗺️ **Rute Maps**: Memakai komponen [`DirectionsMenu`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/DirectionsMenu.tsx) dengan rute navigasi terverifikasi ke nama bisnis bengkel.
  - 📄 **Lihat Profil**: Tombol utama mengarah ke `/bengkel/[slug]`.

---

### US-004: Dual-Experience Layout List & Peta (Desktop vs Mobile)
**Sebagai** pengguna mobile atau desktop,  
**Saya ingin** melihat peta sebaran lokasi bengkel dengan nyaman tanpa menghambat navigasi daftar,  
**Agar** pengalaman browsing tetap cepat di berbagai resolusi layar.

**Acceptance Criteria:**
- **Desktop (>= 1024px / `lg`)**:
  - Menggunakan tata letak split-view 2 kolom: Daftar Kartu Bengkel di sebelah kiri (`flex-1`) dan Kartu Peta Tempel (*Sticky Map Card*, lebar 420px) di sebelah kanan.
  - Hovering atau memilih kartu bengkel di sebelah kiri otomatis memusatkan peta ke bengkel tersebut, dan menampilkan kartu detail bengkel terpilih di bawah peta.
- **Mobile (< 1024px)**:
  - Tersedia tombol melayang di bagian bawah layar (*Floating View Toggle*): `🗺️ Lihat Peta (X Bengkel)` atau `📋 Lihat Daftar`.
  - Saat mode peta aktif di mobile, peta memenuhi tampilan dengan nyaman, dan di bawah peta terdapat kartu geser/ringkasan bengkel terpilih.
  - Mencegah masalah umum halaman tersangkut gesture zoom peta saat menggulir layar ponsel.

---

### US-005: Section Edukasi & Artikel Otomotif Terkini
**Sebagai** pengunjung portal,  
**Saya ingin** membaca artikel edukasi dan tips perawatan mobil terbaru dari para praktisi bengkel PPBMR,  
**Agar** saya mendapatkan wawasan teknis yang bermanfaat dan mengenal keahlian para anggota PPBMR.

**Acceptance Criteria:**
- Query Supabase mengambil 3 artikel terbaru dengan kriteria: `status = 'published'` dan `visibility = 'public'`.
- Tampilan kartu artikel mencakup:
  - Gambar cover artikel (atau placeholder elegan bermotif otomotif).
  - Kategori artikel (misal: "Tips & Trik", "Edukasi Mesin").
  - Tanggal publikasi berformat Indonesia (contoh: 2 Nov 2026).
  - Judul artikel dan kutipan ringkas konten (*excerpt* 2 baris).
  - Profil bengkel penulis/penerbit (nama & logo).
- Tombol *"Lihat Semua Artikel"* di pojok kanan atas section yang mengarah ke `/artikel`.

---

### US-006: Section Standar Asosiasi PPBMR & Banner Ajakan Bergabung
**Sebagai** pemilik bengkel yang belum bergabung atau pengguna umum,  
**Saya ingin** mengetahui latar belakang asosiasi PPBMR dan bagaimana bengkel dapat mendaftar menjadi anggota resmi,  
**Agar** ekosistem bengkel berkualitas di Malang Raya terus berkembang.

**Acceptance Criteria:**
- **Section Profil Keunggulan PPBMR**:
  - Statistik ringkas direktori: Jumlah Bengkel Tergabung, 3 Wilayah Cakupan, Ratusan Teknisi Tersertifikasi.
  - 3 Nilai Pokok Asosiasi: Standarisasi Mutu Layanan, Perlindungan & Jaminan Konsumen, Sinergi & Pelatihan Berkala.
- **Banner CTA Pemilik Bengkel (Join Us)**:
  - Banner bermotif modern di bagian bawah dengan headline: *"Punya Bengkel Mobil di Malang Raya? Mari Bergabung Bersama PPBMR"*.
  - Teks penjelasan benefit keanggotaan (akses direktori digital, pelatihan teknisi, kerja sama suku cadang, legalitas).
  - Tombol CTA: *"Hubungi Sekretariat PPBMR"* (link WhatsApp pengurus/kontak asosiasi) dan link menuju info pendaftaran.

---

## 5. Komponen Teknis & Palet Visual

- **Palet Warna**: Mengikuti token tema `bengkelmobil` (`bg-hero`, `text-primary`, `bg-signal`, `text-signal`, `bg-card`, `border-border`, dsb.).
- **Komponen Digunakan**:
  - [`WorkshopLogo`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/WorkshopLogo.tsx) untuk avatar logo bengkel.
  - [`DirectionsMenu`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/DirectionsMenu.tsx) untuk rute multi-aplikasi (Google Maps, Waze).
  - [`Input`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/ui/input.tsx), [`Button`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/ui/button.tsx), [`Badge`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/ui/badge.tsx).
  - `lucide-react`: `ShieldCheck`, `Wrench`, `MapPin`, `Phone`, `Clock`, `Sparkles`, `Tag`, `Navigation`, `ChevronRight`, `ArrowRight`, `Search`, `X`, `ExternalLink`.

---

## 6. Dampak terhadap File Proyek

| File | Status | Keterangan Perubahan |
|---|---|---|
| [`src/routes/index.tsx`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/routes/index.tsx) | **Modify** | Perombakan total struktur halaman: Hero baru + Trust Pillars, Multi-filter Wilayah & Layanan & Promo, Kartu bengkel baru berfitur WA + Promo + Profil, Mobile floating toggle, Section 3 Artikel Terkini, Section Keunggulan PPBMR + CTA Pemilik Bengkel. |
| `src/test/index.test.tsx` (atau sejenis) | **Verify/Add** | Memastikan pengujian routing dan filter berjalan sempurna tanpa breaking change. |

---

Dokumen ini siap dijadikan acuan implementasi bertahap pada fase eksekusi.

