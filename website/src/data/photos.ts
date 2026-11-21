import type { L } from './types.ts';

export type Photo = { file: string; alt: L; credit: { author: string; url: string } };

/** Stock photos (Unsplash licence). File names live in src/assets/photos/. Swap a file and its entry when the foundation has its own photos. */
export const photos = {
  hero1: { file: "hero1.jpg", alt: { en: "Aerial view of lush tropical forest in Bali", id: "Pemandangan udara hutan tropis yang rimbun di Bali" }, credit: { author: "Geio Tischler", url: "https://unsplash.com/photos/UtilSW8zuZk" } },
  hero2: { file: "hero2.jpg", alt: { en: "Aerial view of rice fields in Ubud", id: "Pemandangan udara sawah di Ubud" }, credit: { author: "Antonio Araujo", url: "https://unsplash.com/photos/Hj_h_LvGTss" } },
  hero3: { file: "hero3.jpg", alt: { en: "Sunlight streaming into an empty classroom", id: "Cahaya matahari masuk ke ruang kelas kosong" }, credit: { author: "Jun Ren", url: "https://unsplash.com/photos/RTFX0TQHXko" } },
  aboutHero: { file: "about-hero.jpg", alt: { en: "Smiling boys from Papua", id: "Anak-anak laki-laki tersenyum dari Papua" }, credit: { author: "Dino Januarsa", url: "https://unsplash.com/photos/JzGl5_0fC2I" } },
  workHero: { file: "work-hero.jpg", alt: { en: "An elderly farmer in a straw hat", id: "Seorang petani lanjut usia bertopi jerami" }, credit: { author: "Polina Kuzovkova", url: "https://unsplash.com/photos/6ySPcMiS_rg" } },
  contactHero: { file: "contact-hero.jpg", alt: { en: "Two girls in traditional Sasak dress", id: "Dua anak perempuan berpakaian adat Sasak" }, credit: { author: "Maximus Beaumont", url: "https://unsplash.com/photos/4eOOGZVS-zw" } },
  ctaBand: { file: "cta-band.jpg", alt: { en: "People stacking their hands together", id: "Orang-orang menumpuk tangan bersama" }, credit: { author: "Rineshkumar Ghirao", url: "https://unsplash.com/photos/UdDjFekHQuk" } },
  aboutA: { file: "about-a.jpg", alt: { en: "A farmer standing in a rice field in Bali", id: "Seorang petani berdiri di sawah di Bali" }, credit: { author: "Polina Kuzovkova", url: "https://unsplash.com/photos/0OkidWKbO2Q" } },
  aboutB: { file: "about-b.jpg", alt: { en: "A boy seated at a desk in a classroom", id: "Seorang anak laki-laki duduk di meja di dalam kelas" }, credit: { author: "ochimax studio", url: "https://unsplash.com/photos/gtOpUWtSzlo" } },
  health: { file: "health.jpg", alt: { en: "A father carrying his child", id: "Seorang ayah menggendong anaknya" }, credit: { author: "Maximus Beaumont", url: "https://unsplash.com/photos/icL-qUOOiFo" } },
  food: { file: "food.jpg", alt: { en: "People shopping at a traditional market", id: "Orang-orang berbelanja di pasar tradisional" }, credit: { author: "Prabu Panji", url: "https://unsplash.com/photos/8vF5Kikv3RI" } },
  climate: { file: "climate.jpg", alt: { en: "Misty tropical forest", id: "Hutan tropis berkabut" }, credit: { author: "Lingchor", url: "https://unsplash.com/photos/lDy1K7RkLeA" } },
  education: { file: "education.jpg", alt: { en: "Children posing together in a classroom", id: "Anak-anak berpose bersama di dalam kelas" }, credit: { author: "ochimax studio", url: "https://unsplash.com/photos/OrYcBjIzb3M" } },
  update1: { file: "update1.jpg", alt: { en: "Hands joined together in the middle of a circle", id: "Tangan-tangan bertemu di tengah lingkaran" }, credit: { author: "Camylla Battani", url: "https://unsplash.com/photos/ABVE1cyT7hk" } },
  update2: { file: "update2.jpg", alt: { en: "Fists bumped together over a desk", id: "Kepalan tangan beradu di atas meja" }, credit: { author: "Antonio Janeski", url: "https://unsplash.com/photos/CHVTt0aGbx0" } },
  tileWheat: { file: "tile-wheat.jpg", alt: { en: "Golden wheat stalks in a field", id: "Batang gandum keemasan di ladang" }, credit: { author: "B S", url: "https://unsplash.com/photos/Q2Z6BnGn0ys" } },
  tileRice: { file: "tile-rice.jpg", alt: { en: "Raw white rice grains", id: "Butir beras putih" }, credit: { author: "Pierre Bamin", url: "https://unsplash.com/photos/-LdilhDx3sk" } },
  tileSalt: { file: "tile-salt.jpg", alt: { en: "A tiled salt field", id: "Ladang garam" }, credit: { author: "Timo Volz", url: "https://unsplash.com/photos/lPaVwVGDQUs" } },
  tileLeaf: { file: "tile-leaf.jpg", alt: { en: "Green leaves", id: "Daun hijau" }, credit: { author: "Rémi Walle", url: "https://unsplash.com/photos/Ui3bOgnjtl0" } },
  tilePlate: { file: "tile-plate.jpg", alt: { en: "A bowl of fresh vegetables", id: "Semangkuk sayuran segar" }, credit: { author: "Anna Pelzer", url: "https://unsplash.com/photos/IGfIGP5ONV0" } },
  tileSchool: { file: "tile-school.jpg", alt: { en: "An empty classroom with wooden desks", id: "Ruang kelas kosong dengan bangku kayu" }, credit: { author: "2y.kang", url: "https://unsplash.com/photos/dFohf_GUZJ0" } },
  workRnd: { file: "work-rnd.jpg", alt: { en: "A black microscope", id: "Mikroskop hitam" }, credit: { author: "Yassine Khalfalli", url: "https://unsplash.com/photos/_c70Nhh6p44" } },
  workMel: { file: "work-mel.jpg", alt: { en: "Statistics on a laptop screen", id: "Statistik di layar laptop" }, credit: { author: "Carlos Muza", url: "https://unsplash.com/photos/hpjSkU2UYSU" } },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
