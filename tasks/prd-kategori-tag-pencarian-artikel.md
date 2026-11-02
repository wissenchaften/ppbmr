[PRD]

# PRD: Kategori, Tag & Pencarian Full-Text Artikel

## Overview

Pengunjung direktori bengkel mobil PPBMR membutuhkan cara cepat untuk menemukan artikel panduan, tips teknis, dan promo yang relevan. Saat ini, halaman `/artikel` menampilkan seluruh artikel dalam satu daftar panjang tanpa pengelompokan maupun pencarian. Fitur ini menambahkan sistem Kategori Utama terkelola (dikelola oleh Admin), sistem Multi-Tag spesifik (ditulis oleh pemilik bengkel), serta Pencarian Full-Text berkinerja tinggi dengan sinkronisasi URL search params di halaman katalog pembaca.

## Goals

- Memungkinkan Admin mengelola daftar kategori artikel resmi (`article_categories`) langsung dari halaman `/admin`.
- Memungkinkan Pemilik Bengkel memilih 1 kategori utama dan menambahkan tag fleksibel (berbasis badge interaktif Enter/Tambah) saat menulis artikel di `/dashboard`.
- Menyediakan antarmuka filter kategori berbasis horizontal pill buttons ("Semua", "Tips & Perawatan", "Promo", dll.) di `/artikel`.
- Menyediakan kolom pencarian interaktif dengan realtime debounce yang mencari kecocokan pada Judul, Isi Konten, Nama Bengkel, dan Tags artikel.
- Menyinkronkan status pencarian dan kategori ke URL query string (`/artikel?q=...&category=...`) agar tautan dapat dibagikan dan di-bookmark.

## Quality Gates

These commands must pass for every user story:

- `npm run lint` - Code formatting & static lint checks (0 errors)
- `npm test` - Vitest unit & integration test suite
- `npm run build` - TypeScript checking & Nitro SSR build

## User Stories

### US-001: Skema Database Kategori, Tags & FTS Index

**Description:** As a developer, I want database tables, columns, and indices for categories, tags, and full-text search so that articles can be classified and queried quickly.

**Acceptance Criteria:**

- [x] Drizzle migration file `0005_article_categories_tags_fts.sql` dibuat.
- [x] Tabel `public.article_categories` dibuat dengan kolom `id`, `name`, `slug` (unique), `sort_order`, `created_at`.
- [x] Kolom `category_id` (UUID references article_categories on delete set null) dan `tags` (text[] default '{}') ditambahkan ke tabel `public.articles`.
- [x] Generated column atau GIN index untuk full-text search (`articles_fts_idx`) dan GIN index untuk tags (`articles_tags_idx`) diterapkan.
- [x] RLS policy: `article_categories` dapat dibaca siapa saja (`anon` & `authenticated`), namun insert/update/delete hanya dapat dilakukan oleh role `admin`.
- [x] Seeding kategori default: "Tips & Perawatan", "Promo Bengkel", "Modifikasi & Performa", "Kabar Komunitas".

### US-002: Manajemen Kategori Artikel di Panel Admin

**Description:** As an admin, I want to view, add, and remove article categories in the admin dashboard so that I can organize content topics dynamically.

**Acceptance Criteria:**

- [x] Di `src/routes/admin.tsx`, ditambahkan tab/bagian "Kategori Artikel".
- [x] Menampilkan daftar kategori yang ada beserta jumlah artikel yang menggunakannya (atau tombol hapus jika kosong).
- [x] Form input kategori baru: Admin mengetik nama kategori, sistem otomatis menghasilkan slug URL yang bersih (lowercase, tanda hubung).
- [x] Notifikasi feedback (toast sukses/gagal) saat kategori ditambahkan atau dihapus.

### US-003: Pemilihan Kategori & Input Multi-Tag di Dashboard Penulis

**Description:** As a workshop owner, I want to select a category and add relevant tags when creating an article so that my article is easily discoverable.

**Acceptance Criteria:**

- [x] Form artikel di `src/routes/dashboard.tsx` menyediakan `<select>` untuk memilih 1 Kategori Utama dari data `article_categories`.
- [x] Menyediakan komponen input tags interaktif: Penulis mengetik tag, menekan tombol `Enter` atau mengklik tombol `+ Tambah` untuk membuat chip tag badge.
- [x] Setiap chip tag memiliki tombol silang `x` untuk menghapus tag yang tidak sengaja dimasukkan.
- [x] Payload form artikel menyimpan `category_id` dan array `tags` ke Supabase, tetap mengikuti aturan `pending` review admin.

### US-004: Tampilan Pencarian Debounced, Filter Horizontal Pill & URL Sync di `/artikel`

**Description:** As a reader, I want to filter articles by category pill and search keywords with automatic URL updates so that I can find helpful automotive tips effortlessly.

**Acceptance Criteria:**

- [x] Halaman `src/routes/artikel.index.tsx` menyediakan kolom input pencarian dengan ikon search dan tombol clear 'x'.
- [x] Deretan filter pill button horisontal ("Semua", serta kategori aktif) diletakkan di bawah search bar dengan scroll halus di mobile.
- [x] Terdapat status pill aktif yang jelas dengan warna aksen `primary` / `signal` sesuai [DESIGN.md](file:///c:/Users/Wissenchaften/Downloads/bengkelmobil/DESIGN.md).
- [x] Pencarian teks dieksekusi dengan debounce ~300ms untuk performa optimal.
- [x] State pencarian (`q`) dan kategori terpilih (`category`) otomatis tersinkronisasi ke URL search params (`/artikel?q=oli&category=tips-perawatan`).
- [x] Kartu artikel menampilkan badge nama kategori dan chip tags yang bisa diklik untuk langsung memfilter berdasarkan tag tersebut.
- [x] Menampilkan empty state informatif jika hasil pencarian/filter tidak ditemukan beserta tombol "Reset filter".

## Functional Requirements

- FR-1: Sistem harus menyediakan tabel `article_categories` dengan RLS hanya admin yang boleh mengedit.
- FR-2: Tabel `articles` harus mendukung relasi foreign key `category_id` dan array string `tags`.
- FR-3: Form artikel di dashboard harus mewajibkan pemilihan kategori utama dan memperbolehkan maksimal 10 tags per artikel.
- FR-4: Halaman admin harus memiliki antarmuka CRUD sederhana untuk `article_categories`.
- FR-5: Halaman katalog `/artikel` harus mendukung pencarian yang mencakup `title`, `content`, `tags`, dan nama bengkel (`workshops.name`).
- FR-6: Pengunjung dapat membagikan URL hasil filter (misal: `/artikel?category=promo-bengkel`) dan halaman langsung memuat filter tersebut secara tepat.

## Non-Goals (Out of Scope)

- Sistem pemungutan suara / voting tag (tag voting/upvoting).
- Hierarki sub-kategori bertingkat (hanya kategori datar 1 tingkat).
- Pencarian cerdas berbasis AI semantic/vector embeddings (cukup Full-Text Search PostgreSQL & in-memory text matching).

## Success Metrics

- Query pencarian dan pemfilteran kategori merespons dalam < 100ms di client.
- Admin dapat menambah atau menghapus kategori baru dalam < 10 detik.
- 100% Quality Gates lulus (`npm run lint`, `npm test`, dan `npm run build`).
  [/PRD]
