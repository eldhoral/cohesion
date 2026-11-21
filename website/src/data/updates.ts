import type { Update } from './types.ts';

// From the Direction E mockup. No dates until the client supplies them (open item 4 in the spec).
export const updates: Update[] = [
  {
    slug: 'official-launch',
    title: { en: 'The official launch of Yayasan COHESION', id: 'Peluncuran resmi Yayasan COHESION' },
    summary: { en: 'Who attended, what was announced, and where COHESION goes next.', id: 'Siapa yang hadir, apa yang diumumkan, dan ke mana COHESION melangkah.' },
    tag: { en: 'Event', id: 'Acara' },
    photo: 'update1',
  },
  {
    slug: 'first-board-meeting',
    title: { en: 'First board meeting with our advisors', id: 'Rapat pertama dewan bersama para penasihat' },
    summary: { en: 'Setting priorities for the first year of programmes.', id: 'Menetapkan prioritas untuk program tahun pertama.' },
    tag: { en: 'Governance', id: 'Tata kelola' },
    photo: 'update2',
  },
];
