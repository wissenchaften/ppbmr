# PRD: Redesain UI/UX Panel Admin PPBMR (/admin)

## Overview

Panel Admin (`/admin`) adalah pusat kendali operasional bagi pengurus Perkumpulan Perbengkelan Bersatu Malang Raya (PPBMR) untuk memoderasi konten artikel, mengelola kategori, dan menugaskan pemilik akun ke profil bengkel. 

Meskipun fungsionalitas inti telah bekerja, antarmuka admin saat ini masih terasa seperti formulir dasar yang kaku:
- Belum ada ringkasan metrik operasional (KPI cards) di bagian atas untuk visibilitas cepat.
- Tab "Review artikel" menyajikan konten dan tombol aksi secara bertumpuk tanpa hierarki ergonomis.
- Pengelolaan puluhan bengkel di tab "Pemilik bengkel" tidak memiliki kotak pencarian, tidak ada filter status penugasan, dan email harus diketik manual tanpa auto-suggest.
- Tab "Kategori artikel" masih menggunakan `window.confirm()` browser bawaan alih-alih komponen dialog yang aman.

Dokumen ini mendefinisikan perombakan desain UI/UX menyeluruh untuk Panel Admin agar terlihat bersih, profesional, ergonomis, dan selaras dengan panduan resmi [DESIGN.md](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/DESIGN.md) (Energy 2 / Rhythm 2 / Motion 1).

---

## Goals

1. **Visibilitas Operasional Instan**: Menyajikan 4 Kartu Metrik Ringkas (KPI Cards) di bagian atas halaman: *Menunggu Review*, *Artikel Terbit*, *Bengkel Terdaftar & Terhubung*, serta *Kategori Artikel*.
2. **Alur Moderasi Cepat (Structured Moderation Cards)**: Mendesain ulang kartu antrean review artikel menjadi tata letak 2 kolom responsif (sisi kiri informasi & cuplikan artikel; sisi kanan panel aksi moderasi dan catatan dengan tombol berhierarki warna tegas).
3. **Efisiensi Pengelolaan Pemilik Bengkel**:
   - Menyediakan kolom pencarian bengkel/email.
   - Menyediakan filter status penugasan (*Semua, Belum Terhubung, Sudah Terhubung*).
   - Menyediakan saran otomatis (*HTML5 datalist*) dari daftar email profil pengguna terdaftar untuk mencegah saltik (*typo*).
4. **Desain Kategori yang Rapi**: Mengganti daftar kategori biasa dengan kartu pratinjau badge warna PPBMR dan dialog konfirmasi aman ([`AlertDialog`](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/src/components/ui/alert-dialog.tsx)).
5. **Kesesuaian Desain Sistem**: Mematuhi palet warna OKLCH (`primary`, `signal`, `muted`, `card`), sudut membulat modern (`rounded-2xl`), dan tipografi Archivo/Plus Jakarta Sans.

---

## Quality Gates

- `npm run lint` — Bebas error ESLint & Prettier (0 error).
- `npm run test` — Seluruh rangkaian unit test Vitest lulus.
- `npx tsc --noEmit` — Type-check TypeScript bebas error (0 error).

---

## User Stories

### US-001: Baris Metrik Ringkasan Admin (KPI Cards)

**Description:** Sebagai admin, saya ingin melihat angka-angka ringkasan operasional di bagian atas panel admin agar langsung mengetahui prioritas tugas saya hari ini.

**Acceptance Criteria:**
- [ ] Di bawah judul halaman, terdapat grid 4 kartu metrik responsif:
  1. ⏳ **Menunggu Review**: Angka artikel `pending` dengan aksen amber/warning.
  2. 📢 **Artikel Terbit**: Total artikel `published` dengan aksen emerald.
  3. 🏢 **Bengkel Anggota**: Total bengkel dengan subteks berapa bengkel yang sudah terhubung pemilik.
  4. 🏷️ **Kategori**: Total kategori artikel aktif.
- [ ] Kartu metrik menggunakan kontainer kartu modern dengan bayangan halus (`shadow-2xs border border-border`).

---

### US-002: Kartu Moderasi 2 Kolom Responsif pada Tab "Review Artikel"

**Description:** Sebagai admin, saya ingin meninjau artikel baru dengan cepat tanpa harus scrolling panjang atau mencari-cari tombol aksi.

**Acceptance Criteria:**
- [ ] Kartu antrean review mengadopsi layout 2 kolom responsif:
  - **Sisi Kiri**: Thumbnail cover, logo & nama bengkel, tanggal, kategori, judul artikel, dan cuplikan konten.
  - **Sisi Kanan (Panel Aksi)**: Tombol "Pratinjau Penuh" (buka modal `Dialog`), kolom input catatan, dan 3 tombol tindakan:
    - **Publish Semua** (`variant="signal"` warna oranye/vermilion).
    - **Publish Anggota** (`variant="outline"`).
    - **Tolak** (`variant="destructive"` warna merah).
- [ ] Jika antrean review kosong, menampilkan ilustrasi/pesan kosong yang menenangkan (*"Semua artikel telah selesai ditinjau"*).

---

### US-003: Pencarian, Filter, & Auto-Suggest pada Tab "Pemilik Bengkel"

**Description:** Sebagai admin, saya ingin mencari bengkel tertentu dan menugaskan pemilik akun dengan mudah tanpa mengetik ulang email dari nol.

**Acceptance Criteria:**
- [ ] Tersedia kolom pencarian (*search bar*) untuk mencari berdasarkan nama bengkel atau email pemilik.
- [ ] Tersedia filter status chip:
  - **Semua Bengkel** `(Total)`
  - **Belum Ada Pemilik** `(Jumlah Unassigned)`
  - **Sudah Terhubung** `(Jumlah Assigned)`
- [ ] Input email dilengkapi `<datalist>` yang memuat seluruh email dari tabel `profiles` sehingga admin cukup mengetik 1-2 huruf awal dan memilih dari saran dropdown.
- [ ] Setiap kartu menampilkan badge status kepemilikan yang jelas (hijau jika terhubung, abu-abu jika belum ada pemilik).

---

### US-004: Manajemen Kategori Bersih dengan `AlertDialog`

**Description:** Sebagai admin, saya ingin mengelola kategori artikel dengan antarmuka kartu modern dan dialog konfirmasi penghapusan yang aman.

**Acceptance Criteria:**
- [ ] Setiap item kategori menampilkan badge pratinjau yang persis sama dengan yang tampil di kartu artikel publik.
- [ ] Menampilkan slug dan urutan tampil.
- [ ] Aksi hapus kategori memicu `AlertDialog` Shadcn UI yang ramah pengguna, bukan `window.confirm()` browser bawaan.

---

## Functional Requirements (FR)

- **FR-1**: Panel Admin harus menampilkan 4 kartu metrik real-time: Pending Articles, Published Articles, Total Workshops (Assigned/Unassigned), dan Total Categories.
- **FR-2**: Tab review harus menampilkan antrean dalam kartu terstruktur 2 kolom dengan pemisahan konten dan panel aksi moderasi.
- **FR-3**: Tab pemilik bengkel harus menyediakan filter *All*, *Unassigned*, dan *Assigned*, serta search input nama bengkel/email.
- **FR-4**: Input email pemilik bengkel harus menyediakan saran otomatis (autocomplete) berbasis daftar profil pengguna terdaftar.
- **FR-5**: Penghapusan kategori dan artikel wajib menggunakan komponen `AlertDialog` untuk konfirmasi pembatalan aksi.

---

## Non-Functional Requirements (NFR)

- **NFR-1 (Aksesibilitas & Ergonomi)**: Semua tombol aksi utama memiliki ukuran target sentuh minimal 36px di desktop dan 44px di mobile.
- **NFR-2 (Performa Responsif)**: Filter dan pencarian di tab pemilik bengkel berjalan di sisi klien (in-memory) secara instan tanpa lag kueri jaringan.
- **NFR-3 (Visual Harmony)**: Menggunakan token desain resmi PPBMR: `primary`, `signal`, `muted`, `card`, `border`, `rounded-2xl`.

---

## Out of Scope (Non-Goals)

- Fitur pagination server-side untuk ribuan bengkel (jumlah bengkel Malang Raya < 200, penanganan client-side filter jauh lebih cepat dan instan).
- Ekspor data bengkel ke Excel/CSV.

