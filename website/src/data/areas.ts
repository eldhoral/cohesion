import type { Area } from './types.ts';

// Order fixed by the client (comment on Home 04-06): Education, then R&D, then MEL.
export const areas: Area[] = [
  {
    n: 1,
    slug: 'health-nutrition',
    name: { en: 'Health and Nutrition', id: 'Kesehatan dan Gizi' },
    blurb: { en: 'Healthier diets and services, from community to policy level.', id: 'Pola makan dan layanan yang lebih sehat, dari tingkat komunitas hingga kebijakan.' },
  },
  {
    n: 2,
    slug: 'food-system',
    name: { en: 'Food System', id: 'Sistem Pangan' },
    blurb: { en: 'Sustainable production, access and consumption of nutritious food.', id: 'Produksi, akses, dan konsumsi pangan bergizi yang berkelanjutan.' },
  },
  {
    n: 3,
    slug: 'climate-environment',
    name: { en: 'Climate and Environment', id: 'Iklim dan Lingkungan' },
    blurb: { en: 'Resilient communities living in balance with their environment.', id: 'Komunitas tangguh yang hidup selaras dengan lingkungannya.' },
  },
  {
    n: 4,
    slug: 'education-capacity',
    name: { en: 'Education and Capacity Development', id: 'Pendidikan dan Penguatan Kapasitas' },
    blurb: { en: 'Training, coaching and institutional development.', id: 'Pelatihan, pendampingan, dan pengembangan kelembagaan.' },
  },
  {
    n: 5,
    slug: 'research-development',
    name: { en: 'Research and Development', id: 'Riset dan Pengembangan' },
    blurb: { en: 'Studies that generate and translate evidence for action.', id: 'Kajian yang menghasilkan dan menerjemahkan bukti menjadi tindakan.' },
  },
  {
    n: 6,
    slug: 'monitoring-evaluation-learning',
    name: { en: 'Monitoring, Evaluation, and Learning', id: 'Monitoring, Evaluasi, dan Pembelajaran' },
    blurb: { en: 'Continuous learning that strengthens programme quality.', id: 'Pembelajaran berkelanjutan yang memperkuat kualitas program.' },
  },
];
