# Design Direction: Direktori Bengkel Mobil PPBMR Malang Raya

> Dokumen arah desain (Design Direction) resmi untuk proyek direktori bengkel mobil PPBMR.
> Berfungsi sebagai panduan estetika, karakter merek, dan aturan visual untuk mendampingi filter `antislop`.

---

## 1. Dials (Tingkat Energi & Irama)

Dial: **ENERGY 2 / RHYTHM 2 / MOTION 1**

- **ENERGY 2 (Balanced)**: Tampilan profesional, percaya diri, dan mudah dipercaya. Tidak kaku seperti situs instansi pemerintah, namun tidak berisik seperti web agensi eksperimental.
- **RHYTHM 2 (Consistent with Varied Rhythm)**: Struktur teratur berbasis kartu bengkel dan artikel, diselingi elemen visual yang menonjol (highlight promo, tombol aksi darurat/arah, banner sampul artikel).
- **MOTION 1 (Calm & Purposeful)**: Transisi cepat dan fungsional (hover feedback, accordion toggle, toast notifikasi). Tanpa efek animasi melayang (_floating parallax_) tanpa tujuan.

---

## 2. Identitas & Karakter Merek

- **Produk**: Platform direktori resmi, informasi servis, dan artikel edukasi/promo dari bengkel-bengkel anggota Perkumpulan Perbengkelan Bersatu Malang Raya (PPBMR).
- **Audiens**: Pemilik kendaraan roda empat/motor di Malang Raya yang membutuhkan bengkel terpercaya, teknisi bersertifikat, dan penanganan cepat saat darurat.
- **Kepribadian Visual**:
  - _Dapat Diandalkan (Trustworthy)_: Informasi kontak, alamat maps, dan legalitas jelas.
  - _Transparan & Lugas (Clear)_: Jam operasional, spesialisasi servis, dan tarif/promo tidak berbelit-belit.
  - _Khas Otomotif Modern_: Tegas, rapi, industrial bersih, tanpa klise gradien neon AI.

---

## 3. Palet Warna (Color System)

Berdasarkan token resmi sistem di `src/styles.css`:

| Token              | Nilai OKLCH            | Peran & Tujuan Visual                                                                                                                      |
| :----------------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **`primary`**      | `oklch(0.45 0.17 262)` | Deep Indigo / Biru Bengkel Profesional. Digunakan untuk identitas utama, header, dan navigasi.                                             |
| **`primary-deep`** | `oklch(0.30 0.12 262)` | Kontras gelap untuk teks utama, footer, atau badge status aktif.                                                                           |
| **`signal`**       | `oklch(0.58 0.22 27)`  | Oranye / Vermilion Otomotif. Digunakan khusus untuk tombol aksi utama (_Call to Action_), kontak darurat, promo hangat, dan aksen penting. |
| **`secondary`**    | `oklch(0.96 0.02 255)` | Latar belakang komponen sekunder dan chip kategori layanan.                                                                                |
| **`background`**   | `oklch(1 0 0)`         | Latar putih bersih untuk kenyamanan membaca di luar ruangan (_outdoor daylight_).                                                          |
| **`muted`**        | `oklch(0.97 0.01 255)` | Area netral untuk membedakan kontainer form dan tabel data.                                                                                |

> **Aturan Warna Antislop**: Warna `signal` hanya boleh digunakan pada elemen fokus utama (tombol tindakan, info darurat, diskon). Jangan sebarkan warna aksen ke setiap sudut antarmuka.

---

## 4. Tipografi

- **Display & Headings (H1, H2, H3)**: `"Archivo", "Plus Jakarta Sans", sans-serif`
  - Karakter tebal (_font-black / font-extrabold_), berjarak huruf padat (_tracking-tight_), memberikan kesan mekanikal yang presisi dan mantap.
- **Body & UI Text**: `"Plus Jakarta Sans", sans-serif`
  - Ergonomis, mudah dibaca pada layar smartphone dari jarak pandang di dalam kendaraan.
- **Ukuran & Hierarki**:
  - Judul Halaman: `text-3xl sm:text-4xl font-black`
  - Subjudul / Card Title: `text-lg sm:text-xl font-extrabold`
  - Teks Isi / Informasi: `text-sm sm:text-base leading-relaxed`

---

## 5. Komponen & Tata Letak

1. **Kartu Bengkel & Artikel**:
   - Sudut melengkung konsisten: `rounded-xl` atau `rounded-2xl` (`border-border`).
   - Tanpa efek kaca buram bertumpuk (_excessive glassmorphism_). Kartu harus solid dan kontras jelas terhadap latar belakang.
2. **Tombol Interaksi & Tombol Panggilan (CTA)**:
   - Tombol petunjuk arah (Google Maps / Waze) dan WhatsApp selalu memiliki ukuran tap minimal 44x44px di mobile.
3. **Copywriting & Nada Bicara**:
   - Gunakan bahasa Indonesia yang akrab, jelas, dan percaya diri (misal: _"Bengkel terbaik dan terpercaya di Malang Raya"_).
   - Hindari kata-kata klise AI seperti: _"Membuka potensi kendaraan Anda"_, _"Solusi mutakhir yang revolusioner"_, atau taburan emoji berlebihan.
