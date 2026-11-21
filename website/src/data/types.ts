/** A string in both site languages. */
export type L<T = string> = { en: T; id: T };

export type Person = {
  slug: string;
  name: string;
  group: 'trustees' | 'management' | 'supervisor';
  role: L;
  /** file name inside src/assets/people/ */
  photo: string;
  bio: L<string[]>;
};

export type Advisor = { name: string; roles: L<string[]> };

export type Area = { n: 1 | 2 | 3 | 4 | 5 | 6; slug: string; name: L; blurb: L };

export type Update = { slug: string; title: L; summary: L; tag: L; /** key of src/data/photos.ts */ photo: string };

export type Publication = { slug: string; title: L; type: 'report' | 'brief' | 'note'; file: string };
