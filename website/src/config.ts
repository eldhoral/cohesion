import type { Locale } from './i18n/index.ts';

const message: Record<Locale, string> = {
  en: 'Hello, I would like to collaborate with COHESION. My name is ... from ... and we are working on ...',
  id: 'Halo, saya ingin berkolaborasi dengan COHESION. Nama saya ... dari ... dan kami sedang mengerjakan ...',
};

export const config = {
  site: 'https://cohesion-foundation.org',
  name: 'COHESION',
  phone: '+62 8122 281026',
  phoneHref: 'tel:+628122281026',
  email: 'info@cohesion-foundation.org',
  address: 'Ruko De Khirani No 3, Jl Bhakti ABRI, RT 04/RW 06, Kel. Sukamaju Baru, Kec. Tapos, Kota Depok, Jawa Barat 16455',
  /** Not supplied yet. Empty string hides every LinkedIn link. */
  linkedin: '',
  profilePdf: '/COHESION-Organization-Profile.pdf',
  whatsapp(lang: Locale): string {
    return `https://wa.me/628122281026?text=${encodeURIComponent(message[lang])}`;
  },
  whatsappMessage: message,
};
