# PRD: Upload Logo Bengkel & Kompresi Otomatis Klien (WebP Canvas)

## Overview

Sebelumnya, pemilik bengkel di dasbor PPBMR (`/dashboard`) hanya dapat memasukkan URL teks manual untuk kolom logo bengkel (`f.logo_url`). Hal ini menyulitkan pemilik bengkel non-teknis yang tidak memiliki server hosting gambar sendiri dan berisiko menghasilkan tautan eksternal yang rusak (*broken links*). 

Dokumen ini mendefinisikan implementasi fitur pengunggahan file logo bengkel langsung dari perangkat pemilik ke bucket Supabase Storage (`workshop-logos`), yang diperkuat dengan modul kompresi dan konversi format otomatis di sisi klien (browser) untuk memastikan performa situs tetap cepat dan hemat kuota penyimpanan.

---

## Goals

1. **Pengalaman Pengguna Sederhana**: Memungkinkan pemilik bengkel mengunggah file logo langsung dari ponsel atau komputer melalui penjelajah file (*file picker*) maupun seret-dan-lepas (*drag-and-drop*).
2. **Kompresi Otomatis di Browser**: Mengompresi dan me-resize gambar secara transparan di sisi peramban sebelum dikirim ke server, memangkas ukuran file mentah dari 1–2 MB menjadi 15–45 KB (>95% penghematan).
3. **Preservasi Transparansi Logo**: Menggunakan format WebP modern yang mempertahankan latar belakang transparan (alpha channel) dari logo PNG, mencegah latar menjadi hitam pekat seperti pada konversi JPEG.
4. **Keamanan Berbasis RLS**: Mengamankan penyimpanan logo menggunakan Supabase Storage Row Level Security (RLS) yang hanya mengizinkan pengguna terautentikasi (*authenticated users*) untuk mengunggah, memperbarui, atau menghapus file.
5. **UI/UX Ergonomis**: Menyediakan komponen `WorkshopLogoUploader` berbentuk kotak 1:1 dengan pratinjau instan, indikator proses kompresi, tombol ganti/hapus, serta *fallback* inisial nama bengkel.

---

## Quality Gates

Setiap perubahan kode harus memenuhi kriteria kualitas berikut:

- `npm run lint` — Lolos pemeriksaan ESLint & Prettier tanpa error (0 error).
- `npm run test` — Seluruh rangkaian pengujian unit (Vitest) lulus.
- `npx tsc --noEmit` — Validasi ketat sistem tipe TypeScript (termasuk `noPropertyAccessFromIndexSignature` dan `noUncheckedIndexedAccess`).

---

## User Stories

### US-001: Supabase Storage Bucket & RLS Policies (`workshop-logos`)

**Description:** Sebagai sistem, saya membutuhkan bucket penyimpanan file `workshop-logos` dengan konfigurasi hak akses publik untuk pembacaan dan kebijakan RLS untuk membatasi proses tulis hanya bagi pengguna terautentikasi.

**Acceptance Criteria:**
- [x] Berkas migrasi SQL [`drizzle/migrations/0006_workshop_logos_storage.sql`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/drizzle/migrations/0006_workshop_logos_storage.sql) disiapkan dengan entri di `storage.buckets`.
- [x] Bucket berstatus `public = true` dengan batas ukuran file awal 2 MB (`file_size_limit = 2097152`).
- [x] Tipe MIME dibatasi pada: `image/jpeg`, `image/png`, `image/webp`, `image/jpg`.
- [x] Kebijakan RLS storage diterapkan:
  - `Public Access to Workshop Logos`: izin SELECT untuk siapa saja (anon dan authenticated).
  - `Authenticated users can upload workshop logos`: izin INSERT khusus authenticated.
  - `Authenticated users can update workshop logos`: izin UPDATE khusus authenticated.
  - `Authenticated users can delete workshop logos`: izin DELETE khusus authenticated.

---

### US-002: Modul Kompresi Gambar Klien (`imageCompression.ts`)

**Description:** Sebagai pengguna seluler maupun desktop, saya ingin gambar logo saya dioptimasi secara otomatis di browser sehingga proses upload berlangsung instan tanpa menghabiskan kuota internet.

**Acceptance Criteria:**
- [x] Dibuat utilitas [`src/lib/imageCompression.ts`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/lib/imageCompression.ts) berbasis HTML5 Canvas native tanpa pustaka eksternal berat.
- [x] Gambar yang memiliki dimensi lebih besar dari 512x512 px di-resize secara proporsional dengan kualitas smoothing tinggi.
- [x] Gambar dikonversi ke format `image/webp` dengan tingkat kualitas 0.85 untuk menjaga ketajaman visual sekaligus menjaga transparansi alpha.
- [x] Mengembalikan objek berisi `file` baru yang telah dikompresi, nilai `originalSize`, dan nilai `compressedSize`.
- [x] Memiliki mekanisme *fallback* aman dan *safety timeout* jika berjalan pada lingkungan SSR atau lingkungan pengujian tanpa implementasi Canvas penuh.
- [x] Disediakan helper `formatFileSize(bytes)` untuk menampilkan ukuran file yang mudah dibaca pengguna (B, KB, MB).

---

### US-003: Upload Helper Supabase (`storage.ts`)

**Description:** Sebagai pengembang antarmuka, saya membutuhkan fungsi helper terpusat untuk memvalidasi dan mengirimkan file logo ke Supabase Storage.

**Acceptance Criteria:**
- [x] Fungsi `uploadWorkshopLogo(file, workshopId, userId)` ditambahkan ke [`src/lib/storage.ts`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/lib/storage.ts).
- [x] Melakukan validasi awal: ketersediaan file, format ekstensi yang didukung, dan batas ukuran maksimal (2 MB).
- [x] Menjalankan fungsi `compressImage` sebelum pengunggahan dilakukan.
- [x] Menyimpan file dengan struktur path terpartisi: `${workshopId}/${Date.now()}-${uuid}.webp`.
- [x] Mengembalikan URL publik file yang dapat diakses secara permanen oleh peramban.

---

### US-004: Komponen Visual `WorkshopLogoUploader`

**Description:** Sebagai pemilik bengkel, saya ingin melihat tampilan kotak logo yang jelas dengan tombol aksi yang mudah digunakan di dasbor bengkel saya.

**Acceptance Criteria:**
- [x] Komponen [`src/components/WorkshopLogoUploader.tsx`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/WorkshopLogoUploader.tsx) menampilkan kotak bujur sangkar (1:1 ratio) berukuran `h-24 w-24`.
- [x] Jika belum ada logo, menampilkan *fallback* inisial nama bengkel dengan aksen titik sinyal khas PPBMR (`WorkshopLogo`).
- [x] Mendukung aksi seret-dan-lepas (*drag & drop*) dengan indikator visual saat file berada di atas area dropzone.
- [x] Menampilkan status spinner loading "Kompresi…" saat proses pengolahan dan upload berlangsung.
- [x] Menyediakan tombol **Unggah / Ganti Logo** dan tombol **Hapus Logo**.
- [x] Menampilkan toast sonner informatif yang memberitahukan persentase penghematan ukuran file setelah dioptimasi.

---

### US-005: Integrasi Formulir Profil Bengkel di `/dashboard`

**Description:** Sebagai pemilik bengkel, logo yang saya unggah harus tersimpan ke database profil bengkel dan langsung terlihat di pratinjau kartu ringkasan dasbor.

**Acceptance Criteria:**
- [x] Input teks manual pada Kartu 1 (Identitas & Lokasi) di [`src/routes/dashboard.tsx`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/routes/dashboard.tsx) diganti dengan `WorkshopLogoUploader`.
- [x] Ketika logo selesai diunggah atau dihapus, nilai URL langsung memperbarui state `f.logo_url`.
- [x] Kartu Hero Summary di bagian atas halaman `/dashboard` langsung menampilkan logo baru secara reaktif (*live preview*).
- [x] Saat pemilik menekan tombol "Simpan Profil Bengkel", URL logo baru tersimpan ke kolom `workshops.logo_url` di database PostgreSQL.

---

## Functional Requirements (FR)

- **FR-1**: Sistem harus menyediakan wadah penyimpanan publik bernama `workshop-logos` di Supabase Storage.
- **FR-2**: Input logo hanya boleh menerima file dengan tipe MIME `image/jpeg`, `image/png`, `image/webp`, dan `image/jpg` dengan batas ukuran maksimal 2 MB.
- **FR-3**: Setiap file logo yang diunggah harus otomatis di-resize ke batas maksimum 512x512 piksel dan di-encode ke format WebP kualitas 0.85.
- **FR-4**: Sistem harus mempertahankan transparansi pada logo berlatar transparan.
- **FR-5**: File logo yang berhasil diunggah harus diberi nama unik berbasis stempel waktu dan UUID untuk mencegah konflik berkas antar pengunggahan.
- **FR-6**: Komponen uploader harus menyediakan opsi penghapusan logo yang mengembalikan tampilan ke inisial nama bengkel.

---

## Non-Functional Requirements (NFR)

- **NFR-1 (Performa & Efisiensi Bandwidth)**: Waktu kompresi gambar di browser harus berlangsung di bawah 300 ms pada perangkat standar, dan ukuran file akhir yang diunggah tidak boleh melebihi 100 KB (rata-rata 15–45 KB).
- **NFR-2 (Aksesibilitas & Sentuhan)**: Target sentuhan tombol aksi (Ganti/Hapus) harus memenuhi standar minimal 44x44 px atau proporsional untuk interaksi layar sentuh perangkat seluler.
- **NFR-3 (Keamanan)**: Kunci anon Supabase tidak boleh memiliki hak menghapus atau mengubah file tanpa session autentikasi aktif.
- **NFR-4 (Ketahanan Kegagalan)**: Jika peramban pengguna gagal menjalankan kompresi Canvas, sistem harus secara elegan mengunggah file asli tanpa memblokir alur pengguna.

---

## Non-Goals (Out of Scope)

- Pemotongan manual interaktif (*manual cropper / pan & zoom tool*). Gambar di-resize secara proporsional otomatis.
- Fitur watermark otomatis pada logo bengkel.
- Riwayat versi logo lama (logo lama digantikan dengan URL baru).

