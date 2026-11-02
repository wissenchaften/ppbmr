# PRD: Manajemen Artikel Mandiri oleh Pemilik Bengkel (Draf, Edit, & Hapus)

## Overview

Saat ini, pemilik bengkel di dasbor PPBMR (`/dashboard`) hanya dapat menulis artikel baru satu arah. Setelah dikirim, pemilik bengkel tidak dapat menyimpan draf sementara, tidak dapat memperbaiki/mengedit artikel yang ditolak atau yang ingin disempurnakan, dan tidak dapat menghapus artikel miliknya.

Dokumen ini mendefinisikan penambahan fitur **Manajemen Artikel Mandiri** bagi pemilik bengkel:
1. **Draf Artikel**: Kemampuan menyimpan artikel secara lokal/database dengan status `draft` sebelum siap diajukan ke admin.
2. **Edit Kembali Artikel**: Mengedit artikel yang berstatus `draft`, `rejected` (revisi catatan admin), atau memperbarui artikel `published`.
3. **Hapus Artikel Terkendali**: Kemampuan menghapus artikel berstatus `draft` dan `rejected` dengan konfirmasi aman dan pembersihan otomatis berkas gambar di storage, dengan pembatasan hak akses yang ditegakkan di level database (RLS).
4. **Navigasi & Filter Status**: Filter chips status (*Semua, Draf, Menunggu Review, Terbit, Ditolak*) pada daftar "Artikel Saya".

---

## Goals

1. **Pemberdayaan Penulis**: Pemilik bengkel dapat mencicil penulisan konten tanpa terburu-buru mengirimkannya ke antrean moderasi admin.
2. **Siklus Revisi Transparan**: Pemilik dapat melihat catatan penolakan admin (*admin note*), memperbaiki konten secara langsung di form editor, dan mengajukan ulang ke status `pending`.
3. **Keamanan & Kebijakan Hapus yang Ketat**: Menegakkan aturan bahwa artikel yang sedang dalam peninjauan (`pending`) atau sudah terbit (`published`) tidak dapat dihapus sepihak oleh pemilik (harus melalui admin) guna menjaga konsistensi data publik dan audit trail.
4. **Kebersihan Penyimpanan**: Otomatis menghapus file gambar cover di Supabase Storage saat artikel draf/ditolak dihapus.
5. **Performa Tetap Ringan**: Penambahan status enum dan filter tidak membebani komputasi database dan kueri tetap terindeks optimal.

---

## Quality Gates

- `npm run lint` — Bebas error ESLint & Prettier (0 error).
- `npm run test` — Seluruh rangkaian unit test Vitest lulus.
- `npx tsc --noEmit` — Validasi TypeScript lolos bersih tanpa kesalahan tipe.

---

## User Stories

### US-001: Skema Database & RLS Policy Status 'Draft'

**Description:** Sebagai sistem, saya membutuhkan penambahan status `draft` pada enum `article_status`, penyesuaian trigger pengamanan status, dan kebijakan RLS penghapusan yang membatasi hak hapus hanya untuk status `draft` dan `rejected`.

**Acceptance Criteria:**
- [ ] Migrasi SQL menambahkan nilai `'draft'` ke enum `public.article_status`.
- [ ] Trigger `guard_article_status()` diperbarui:
  - Pengguna non-admin diizinkan memilih status `'draft'` atau `'pending'`.
  - Jika non-admin mencoba menyetel status `'published'`, trigger otomatis memaksanya menjadi `'pending'`.
  - Jika artikel `published` diedit oleh non-admin, status otomatis diturunkan kembali ke `'pending'` (atau `'draft'` jika disimpan sebagai draf) dan `published_at` di-reset ke `null`.
- [ ] Kebijakan RLS `DELETE` pada tabel `articles` diperbarui:
  - Non-admin hanya dapat menghapus artikel miliknya yang berstatus `'draft'` atau `'rejected'`.
  - Admin tetap memiliki hak menghapus artikel di semua status.

---

### US-002: Filter Status Chips pada Daftar "Artikel Saya"

**Description:** Sebagai pemilik bengkel, saya ingin memfilter daftar artikel saya berdasarkan statusnya agar mudah menemukan draf yang belum selesai atau artikel yang memerlukan revisi.

**Acceptance Criteria:**
- [ ] Di atas grid artikel pada tab "Artikel Bengkel", terdapat deretan filter chip:
  - **Semua** (total artikel)
  - **Draf** (jumlah draf)
  - **Menunggu Review** (jumlah pending)
  - **Terbit** (jumlah published)
  - **Ditolak** (jumlah rejected)
- [ ] Mengklik chip langsung menyaring daftar artikel tanpa reload halaman.
- [ ] Status badge kartu artikel menampilkan badge abu-abu/netral untuk status `Draf`.

---

### US-003: Alur Edit Artikel Terpadu

**Description:** Sebagai pemilik bengkel, saya ingin tombol "Edit" pada kartu artikel saya yang langsung memuat seluruh data artikel ke dalam form editor sehingga saya dapat memperbaruinya.

**Acceptance Criteria:**
- [ ] Setiap kartu artikel di "Artikel Saya" memiliki tombol aksi **"Edit"**.
- [ ] Saat tombol "Edit" diklik:
  - Tampilan otomatis beralih ke sub-tab editor.
  - Header form berubah menjadi: `"Edit Artikel: [Judul]"` dengan indikator status saat ini.
  - Seluruh field terisi otomatis: Judul, Kategori Utama, Tags, Gambar Cover, dan Isi Konten Markdown.
- [ ] Tersedia tombol aksi ganda di bagian bawah form:
  - **"Simpan sebagai Draf"** (memperbarui data dengan status `draft`).
  - **"Kirim ke Admin"** (memperbarui data dengan status `pending`).
  - **"Batal Edit"** (mengosongkan form dan kembali ke daftar artikel).

---

### US-004: Hapus Artikel dengan Dialog Konfirmasi & Pembersihan Storage

**Description:** Sebagai pemilik bengkel, saya ingin dapat menghapus artikel draf atau ditolak yang tidak lagi relevan, lengkap dengan dialog konfirmasi untuk mencegah ketidaksengajaan.

**Acceptance Criteria:**
- [ ] Tombol **"Hapus"** hanya muncul pada kartu artikel berstatus `'draft'` dan `'rejected'`.
- [ ] Untuk artikel berstatus `'pending'` atau `'published'`, tombol hapus dinonaktifkan / disembunyikan dengan tooltip penjelasan: *"Hubungi admin untuk menghapus artikel yang sedang direview atau sudah terbit"*.
- [ ] Saat tombol "Hapus" diklik, muncul `AlertDialog` konfirmasi: *"Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan."*
- [ ] Jika dikonfirmasi:
  - Jika artikel memiliki `cover_url`, file gambar di bucket `article-covers` otomatis dihapus via Supabase Storage API.
  - Baris artikel dihapus dari tabel `public.articles`.
  - Muncul notifikasi toast sukses dan kueri data artikel di-refresh.

---

## Functional Requirements (FR)

- **FR-1**: Enum `public.article_status` harus mendukung empat nilai: `'draft'`, `'pending'`, `'published'`, `'rejected'`.
- **FR-2**: Trigger `guard_article_status()` harus memvalidasi agar pengguna non-admin tidak dapat menerbitkan artikel langsung ke status `'published'`.
- **FR-3**: Penulis artikel harus dapat menyimpan artikel baru langsung sebagai status `'draft'` atau langsung mengajukannya ke status `'pending'`.
- **FR-4**: Penulis harus dapat memperbarui artikel miliknya kapan saja; jika artikel terbit diperbarui dan dikirim, statusnya berubah menjadi `'pending'` untuk peninjauan admin ulang.
- **FR-5**: Penulis hanya diizinkan menghapus artikel miliknya yang berstatus `'draft'` dan `'rejected'`.
- **FR-6**: Sistem harus menghapus file gambar di storage Supabase saat artikel terkait dihapus.

---

## Non-Functional Requirements (NFR)

- **NFR-1 (Integritas Moderasi)**: Kebijakan moderasi admin tidak boleh dapat dibobol dari sisi klien; verifikasi status wajib ditegakkan di trigger PostgreSQL dan RLS.
- **NFR-2 (Performa Responsif)**: Filter status di sisi klien berlangsung instan tanpa kueri ulang jaringan yang berlebihan.
- **NFR-3 (Keamanan Data)**: Dialog konfirmasi modal wajib mencegah aksi penghapusan yang tidak disengaja.

---

## Out of Scope (Non-Goals)

- Fitur auto-save per ketukan (*real-time typing autosave*). Penyimpanan draf dilakukan secara eksplisit via tombol "Simpan sebagai Draf".
- Riwayat revisi versi artikel (*version history / git-like diff*).
- Pemindahan kepemilikan artikel ke bengkel lain.

