# PRD: Rich Text Editor & Image Upload Fitur Artikel

## Overview

Fitur Artikel saat ini masih menggunakan input teks biasa (`textarea`) dan input tautan URL manual untuk cover. Dokumen ini mendefinisikan implementasi Rich Text Editor (formatting markdown/WYSIWYG: heading, bold, italic, list) serta pengunggahan gambar cover langsung ke Supabase Storage pada form tulis artikel di dashboard pemilik bengkel, sembari tetap mematuhi aturan moderasi tamper-proof admin yang sudah ada.

## Goals

- Memungkinkan pemilik bengkel memformat teks artikel secara profesional (heading, bold, italic, bullet list, blockquote).
- Menyediakan upload gambar cover langsung (file picker & drag-and-drop) ke Supabase Storage bucket `article-covers`.
- Merender konten artikel dengan tampilan tipografi rapi di halaman pembaca (`/artikel/$id`).
- Mempertahankan integritas moderasi: setiap artikel yang dikirim/diubah oleh pemilik bengkel tetap berstatus `pending` hingga disetujui admin.

## Quality Gates

These commands must pass for every user story:

- `npm run lint` - Linting & code style check
- `npm run build` - TypeScript checking & production build verification

## User Stories

### US-001: Supabase Storage Bucket & Upload Helper

**Description:** As a developer, I want a dedicated Supabase Storage bucket with security policies and a client upload helper so that workshop owners can upload article cover images securely.

**Acceptance Criteria:**

- [x] SQL migration / script disiapkan untuk membuat storage bucket `article-covers` (public read).
- [x] RLS storage policy membatasi upload hanya untuk pengguna terautentikasi (authenticated users).
- [x] File helper upload `src/lib/storage.ts` mengompresi/memvalidasi tipe file gambar (JPG, PNG, WebP) dengan ukuran maksimal 5MB.
- [x] Upload helper mengembalikan URL publik gambar yang berhasil diunggah.

### US-002: Komponen Image Dropzone / Cover Uploader di Dashboard

**Description:** As a workshop owner, I want to upload an image from my computer as an article cover so that I don't need to host images externally.

**Acceptance Criteria:**

- [x] Form di `src/routes/dashboard.tsx` menggantikan input teks URL cover dengan komponen upload gambar interaktif (file input + drag-and-drop).
- [x] Menampilkan indikator progress / loading saat proses pengunggahan gambar berlangsung.
- [x] Menampilkan pratinjau (preview) thumbnail gambar yang diunggah dan tombol untuk menghapus/mengganti gambar.
- [x] URL gambar otomatis terisi ke state form dan tersimpan ke kolom `articles.cover_url`.

### US-003: Rich Text Editor pada Form Tulis Artikel

**Description:** As a workshop owner, I want a rich formatting toolbar when writing articles so that my tips and promo look structured and engaging.

**Acceptance Criteria:**

- [x] `Textarea` polos di `src/routes/dashboard.tsx` ditingkatkan dengan toolbar formatting (Heading, Bold, Italic, Bullet List, Ordered List, Quote).
- [x] Menyediakan tab "Preview" langsung di form penulisan agar penulis dapat melihat tampilan artikel sebelum mengirim.
- [x] Input tetap tervalidasi `required` (tidak boleh kosong atau hanya spasi).
- [x] Saat form disubmit, status artikel tetap `pending` untuk direview admin sesuai aturan database.

### US-004: Rendering Tipografi Rich Text di Halaman Artikel Pembaca

**Description:** As a reader/member, I want to read articles with clean typography and formatted styling so that the content is comfortable to consume.

**Acceptance Criteria:**

- [x] Di `src/routes/artikel.$id.tsx`, konten artikel dirender menggunakan styling tipografi rapi (`prose` / Tailwind typography styling) yang mendukung heading, list, dan penekanan teks.
- [x] Gambar cover ditampilkan secara responsif dengan aspect ratio proporsional dan fallback jika gambar gagal dimuat.
- [x] Proteksi hak akses tetap berjalan (artikel dengan `visibility: members` hanya dapat dibaca penuh oleh anggota/member yang login).

### US-005: Embed Video YouTube di Editor Teks & Halaman Artikel

**Description:** As a workshop owner, I want to embed YouTube videos (tutorials, service showcases, car reviews) directly inside the article body so that readers can watch video demonstrations without leaving the article.

**Acceptance Criteria:**

- [x] Toolbar `MarkdownEditor` dilengkapi tombol icon video YouTube dengan popover dialog input URL.
- [x] Mendukung format sintaks eksplisit `@[youtube](URL_OR_ID)` serta penempelan URL YouTube mandiri di baris baru (*auto-embed*).
- [x] Mendukung semua format URL YouTube: standar (`watch?v=`), shortlink (`youtu.be/`), YouTube Shorts (`shorts/`), dan link embed (`embed/`).
- [x] Pemutar video dirender secara responsif 16:9 (`aspect-video`) menggunakan domain privasi ramah pengguna `youtube-nocookie.com` dengan atribut `loading="lazy"`.
- [x] Tab Pratinjau di editor langsung menampilkan pemutar video secara interaktif.

## Functional Requirements

- FR-1: Sistem harus menyediakan bucket `article-covers` yang bisa diakses publik untuk pembacaan dan hanya bisa diisi oleh user terautentikasi.
- FR-2: Form pembuatan artikel di dashboard harus menerima file gambar (.png, .jpg, .jpeg, .webp) maksimal 5MB dan mengunggahnya ke Supabase Storage.
- FR-3: Form artikel harus menyediakan toolbar formatting teks (Bold, Italic, Heading, List) dan tab preview.
- FR-4: Form submit artikel harus mengirimkan payload `{ workshop_id, author_id, title, content, cover_url }` ke tabel `public.articles` dengan status otomatis `pending`.
- FR-5: Halaman baca artikel (`src/routes/artikel.$id.tsx`) harus menampilkan cover banner di bagian atas dan merender format teks isi artikel secara terstruktur.
- FR-6: Sistem harus memvalidasi URL YouTube dan merender iframe player responsif 16:9 yang aman (`youtube-nocookie.com`) untuk sintaks `@[youtube](...)` maupun URL mandiri di baris baru.

## Non-Goals (Out of Scope)

- Fitur kategori/tag artikel dan pencarian full-text (dialokasikan untuk iterasi berikutnya).
- Sistem komentar, likes, atau jumlah pembaca (view counter).
- Embed platform video selain YouTube (misal Vimeo, TikTok video player di dalam artikel).
- Fitur draft autosave lokal (penulis mengirim langsung ke antrean review).

## Technical Considerations

- Menggunakan Supabase Storage API (`supabase.storage.from('article-covers').upload(...)`).
- Komponen formatting dapat memanfaatkan parser markdown ringan (seperti `react-markdown` atau komponen kustom berbasis Tailwind typography) agar bundle tetap efisien.
- Menjaga aturan tamper-proof di `AGENTS.md`: Trigger database tetap memaksa artikel berstatus `pending` untuk non-admin.

## Success Metrics

- Pemilik bengkel dapat menulis artikel berformat dan mengunggah cover image dalam waktu < 2 menit tanpa kendala teknis.
- Zero regression pada alur moderasi admin (`src/routes/admin.tsx`) dan halaman katalog artikel (`src/routes/artikel.index.tsx`).
- Seluruh Quality Gates (`npm run lint` dan `npm run build`) berhasil 100% tanpa error TypeScript atau linting.

## Open Questions

- Apakah format penyimpanan konten di database tetap berupa string Markdown murni atau HTML? _(Rekomendasi: Markdown murni untuk portabilitas dan keamanan XSS)._
