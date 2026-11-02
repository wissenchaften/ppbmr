# PRD: Manajemen & Moderasi Artikel Panel Admin

## Overview

Seiring dengan diimplementasikannya fitur draf, edit ulang, dan pembatasan hak hapus pada sisi pemilik bengkel (`/dashboard`), Panel Admin (`/admin`) memerlukan peningkatan fungsionalitas agar moderasi dan pengelolaan artikel selaras dengan siklus hidup artikel yang baru.

Saat ini di `/admin`:
- Pratinjau artikel masih berupa teks polos terpotong (`whitespace-pre-line`), tanpa pemformatan Markdown, tanpa penampil tags/kategori, dan tanpa player video YouTube.
- Tab "Semua artikel" mencampur seluruh data tanpa fitur pencarian, filter status, maupun filter bengkel.
- Admin belum memiliki tombol **Hapus Artikel** (padahal pemilik bengkel dilarang menghapus artikel `pending` dan `published` sehingga wajib meminta bantuan admin).
- Admin belum memiliki opsi menarik artikel yang terlanjur terbit (*unpublish* / kembalikan ke review).
- Tab review berisiko menampilkan artikel draf yang belum siap diajukan oleh pemilik bengkel.

Dokumen ini menetapkan spesifikasi peningkatan fitur manajemen dan moderasi artikel di panel admin PPBMR.

---

## Goals

1. **Moderasi yang Terarah**: Tab "Review Artikel" secara ketat hanya menampilkan artikel yang berstatus `pending`. Artikel dengan status `draft` milik bengkel tetap bersifat privat dan tidak masuk antrean moderasi.
2. **Pratinjau Penuh yang Akurat**: Admin dapat membuka modal dialog pratinjau artikel yang merender layout nyata menggunakan `MarkdownView`, pemutar YouTube responsif 16:9, banner cover, badges kategori, dan tags sebelum mengambil keputusan moderasi.
3. **Kewenangan Hapus oleh Admin**: Menyediakan tombol hapus artikel untuk admin pada semua status (khususnya untuk merespons permintaan pemilik bengkel yang ingin mencabut artikel terbit/review), dilengkapi pembersihan otomatis file cover di Supabase Storage.
4. **Fleksibilitas Status & Penarikan Publikasi (*Unpublish*)**: Admin dapat mengubah status artikel terbit menjadi `pending` atau `rejected` jika ditemukan pelanggaran atau informasi usang tanpa harus menghapus artikel.
5. **Pencarian & Filter Cepat**: Pada tab "Semua Artikel", admin dapat mencari artikel berdasarkan kata kunci judul/nama bengkel dan menyaring berdasarkan status (`draft`, `pending`, `published`, `rejected`).
6. **Catatan Moderasi Transparan**: Setiap penolakan artikel dapat disertai catatan alasan yang jelas agar pemilik bengkel dapat langsung memperbaikinya melalui fitur edit di dasbor mereka.

---

## Quality Gates

- `npm run lint` — Bebas error ESLint & Prettier (0 error).
- `npm run test` — Seluruh rangkaian unit test Vitest lulus.
- `npx tsc --noEmit` — Validasi ketat TypeScript lolos tanpa error.

---

## User Stories

### US-001: Filter Ketat Antrean Moderasi (`status: pending`)

**Description:** Sebagai admin, saya ingin antrean review artikel hanya memuat artikel yang secara eksplisit diajukan oleh pemilik bengkel (`pending`), bukan draf yang masih dikerjakan.

**Acceptance Criteria:**
- [ ] Kueri pada tab "Review Artikel" secara tegas memfilter `status.eq('pending')`.
- [ ] Jumlah badge antrean review menampilkan angka akurat artikel pending.
- [ ] Artikel berstatus `draft` tidak pernah muncul di tab review.

---

### US-002: Modal Pratinjau Lengkap Artikel

**Description:** Sebagai admin, saya ingin memeriksa artikel secara utuh persis seperti yang akan dilihat oleh pembaca (format markdown tebal/miring/heading, tautan, gambar cover, dan video YouTube).

**Acceptance Criteria:**
- [ ] Setiap kartu artikel di panel admin memiliki tombol **"Pratinjau Penuh"** / icon mata.
- [ ] Mengklik tombol membuka `Dialog` modal besar yang menampilkan:
  - Header: Nama bengkel, nama kategori, chips tags, tanggal pengajuan.
  - Gambar cover banner proporsional.
  - Judul artikel lengkap.
  - Isi konten yang dirender penuh menggunakan komponen `MarkdownView` (termasuk pemutar YouTube 16:9 yang dapat diputar).
- [ ] Admin dapat langsung mengambil tindakan moderasi (Setujui / Tolak) dari dalam modal pratinjau tanpa harus menutup dialog terlebih dahulu.

---

### US-003: Aksi Moderasi Komprehensif & Unpublish

**Description:** Sebagai admin, saya ingin opsi tindakan moderasi yang lengkap: menerbitkan untuk umum, menerbitkan khusus anggota, menolak dengan catatan, atau mencabut artikel yang sudah terbit (*unpublish*).

**Acceptance Criteria:**
- [ ] Aksi terbit publik: Mengubah `status: 'published'` dan `visibility: 'public'`.
- [ ] Aksi terbit anggota: Mengubah `status: 'published'` dan `visibility: 'members'`.
- [ ] Aksi tolak: Mengubah `status: 'rejected'` disertai input `admin_note`. Catatan ini otomatis tersinkronisasi dan tampil di kartu artikel dasbor pemilik bengkel.
- [ ] Aksi tarik publikasi (*Unpublish*): Pada artikel berstatus `published`, admin memiliki tombol untuk mengembalikan status ke `pending` atau `rejected` jika ada konten yang perlu direvisi ulang.

---

### US-004: Hapus Artikel oleh Admin & Pembersihan Storage

**Description:** Sebagai admin, saya ingin dapat menghapus artikel atas permintaan pemilik bengkel, disertai konfirmasi dialog dan pembersihan otomatis file gambar di storage.

**Acceptance Criteria:**
- [ ] Pada tab "Semua Artikel", setiap kartu memiliki tombol **"Hapus Artikel"** (icon tong sampah).
- [ ] Membuka `AlertDialog` konfirmasi: *"Hapus artikel '[Judul]' milik [Nama Bengkel]? Seluruh data dan gambar sampul akan dihapus permanen."*
- [ ] Jika dikonfirmasi:
  - Memanggil `deleteArticleCover(cover_url)` untuk menghapus file dari bucket `article-covers` jika artikel memiliki cover.
  - Menghapus baris artikel dari database via `supabase.from('articles').delete().eq('id', id)`.
  - Menampilkan notifikasi toast sonner dan me-refresh data.

---

### US-005: Pencarian & Filter Status pada Tab "Semua Artikel"

**Description:** Sebagai admin, saya ingin dapat mencari dan memfilter puluhan artikel dengan cepat berdasarkan status, kategori, atau nama bengkel.

**Acceptance Criteria:**
- [ ] Input pencarian teks (*search bar*) dengan *debouncing* untuk mencari berdasarkan judul artikel atau nama bengkel.
- [ ] Filter pills status: *Semua*, *Draf*, *Menunggu Review*, *Terbit*, *Ditolak*.
- [ ] Filter dropdown kategori artikel.
- [ ] Menampilkan pesan kosong yang informatif jika tidak ada artikel yang cocok dengan filter pencarian.

---

## Functional Requirements (FR)

- **FR-1**: Tab "Review artikel" hanya boleh menampilkan artikel dengan `status = 'pending'`.
- **FR-2**: Admin harus dapat menyetujui artikel menjadi `published` dengan pilihan visibilitas `public` atau `members`.
- **FR-3**: Admin harus dapat menolak artikel dengan menyertakan teks catatan `admin_note`.
- **FR-4**: Admin harus dapat mengubah status artikel `published` kembali menjadi `pending` atau `rejected`.
- **FR-5**: Admin harus dapat menghapus artikel di status apa pun dengan konfirmasi modal.
- **FR-6**: Sistem harus menghapus berkas gambar cover di Supabase Storage saat artikel dihapus oleh admin.
- **FR-7**: Dialog pratinjau artikel harus menggunakan komponen `MarkdownView` untuk menjamin keselarasan tampilan dengan halaman pembaca publik.

---

## Non-Functional Requirements (NFR)

- **NFR-1 (Konsistensi Desain)**: Mengikuti pedoman [DESIGN.md](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/DESIGN.md) (Card rounded-2xl, OKLCH status palette, tipografi Archivo/Plus Jakarta Sans).
- **NFR-2 (Keamanan Admin)**: Seluruh aksi moderasi, update, dan delete diproteksi fungsi `public.has_role(auth.uid(), 'admin')` di level RLS PostgreSQL.
- **NFR-3 (Performa Kueri)**: Kueri artikel dioptimasi dengan relasi foreign key `workshops(name,logo_url)` dan `article_categories(name)`.

---

## Out of Scope (Non-Goals)

- Penulisan artikel baru secara langsung oleh admin (artikel tetap berasal dari pemilik bengkel).
- Sistem audit log terpisah dalam tabel khusus (status perubahan artikel dicatat langsung pada kolom `status`, `published_at`, dan `admin_note`).

