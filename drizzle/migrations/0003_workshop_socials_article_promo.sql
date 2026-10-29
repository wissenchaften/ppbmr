alter table public.workshops
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists youtube text,
  add column if not exists tiktok text,
  add column if not exists whatsapp text,
  add column if not exists profile_article text,
  add column if not exists promo_title text,
  add column if not exists promo_text text;
update public.workshops set
  website = 'https://www.bengkelmobilmalang.com',
  instagram = 'https://www.instagram.com/ccr_autoservice',
  facebook = 'https://web.facebook.com/wahidinCCR',
  youtube = 'https://www.youtube.com/@bengkelmobilmalang',
  whatsapp = 'https://wa.me/6282143025758',
  promo_title = 'Penawaran Spesial Hari Ini!',
  promo_text = 'Bonus + promo setiap perawatan: cek kendaraan gratis, layanan antar-jemput, dan banyak lagi. Garansi perbaikan sampai 1 tahun (ketentuan berlaku). Konsultasi gratis via WhatsApp.',
  profile_article = E'Best Service, Smart Choice\n\nSelamat datang di Bengkel CCR Auto Service — solusi terbaik untuk perawatan dan perbaikan mobil Anda. Percayakan perawatan dan perbaikan mobil Anda pada ahlinya dan rasakan perbedaannya.\n\nKetika mobil Anda mengalami masalah, mencari bengkel yang dapat diandalkan dan profesional bisa menjadi tugas yang sulit. Kami memahami betapa pentingnya memiliki mobil yang dapat diandalkan. Kami menyediakan solusi lengkap untuk perbaikan mobil Anda dengan layanan terbaik, tim teknisi berpengalaman, dan peralatan terkini.\n\nKami menawarkan beragam layanan reparasi: perbaikan mesin, kemudi, sistem kelistrikan, sistem rem, AC mobil, remap ECU, dan banyak lagi — dengan suku cadang berkualitas tinggi dan teknologi terkini.\n\nKenapa CCR?\n• Teknisi profesional, berpengalaman, dan terlatih.\n• Pelayanan pelanggan yang ramah dan responsif.\n• Suku cadang dan chemical berkualitas, peralatan canggih dan akurat.\n\nMobil sehat, perjalanan menyenangkan. Keselamatan dan kenyamanan berkendara Anda adalah prioritas kami.'
where slug = 'ccr-auto-service';
update public.workshops set
  website = 'https://bengkelbunul.wixsite.com/bengkelbunul',
  whatsapp = 'https://wa.me/6285100207777',
  profile_article = E'Bengkel Bunul siap mengatasi permasalahan pada mobil Anda di mana pun Anda berada. Kami memiliki cabang di beberapa titik di Malang.'
where slug = 'bengkel-bunul';
update public.workshops set whatsapp = 'https://wa.me/628125251479' where slug = 'bengkel-samudro';
update public.workshops set whatsapp = 'https://wa.me/6281216085191' where slug = 'aas-aspawi-auto-service';