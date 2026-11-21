import type { ImageMetadata } from 'astro';
import { photos, type PhotoKey } from './photos.ts';

const photoFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.jpg', { eager: true });
const peopleFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/people/*.jpg', { eager: true });

/** Resolve a src/data/photos.ts key to its image, alt text and credit. */
export function photo(key: PhotoKey) {
  const p = photos[key];
  const mod = photoFiles[`../assets/photos/${p.file}`];
  if (!mod) throw new Error(`photo file missing for "${key}": ${p.file}`);
  return { src: mod.default, alt: p.alt, credit: p.credit };
}

export function personImage(photoFile: string): ImageMetadata {
  const mod = peopleFiles[`../assets/people/${photoFile}`];
  if (!mod) throw new Error(`person photo missing: ${photoFile}`);
  return mod.default;
}

