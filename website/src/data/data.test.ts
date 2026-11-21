import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { people, teamGroups } from './people.ts';
import { advisors } from './advisors.ts';
import { areas } from './areas.ts';
import { updates } from './updates.ts';
import { photos } from './photos.ts';
import { publications } from './publications.ts';

const assetDir = new URL('../assets/', import.meta.url);

test('there are seven people with unique kebab-case slugs', () => {
  assert.equal(people.length, 7);
  const slugs = people.map((p) => p.slug);
  assert.equal(new Set(slugs).size, 7);
  for (const s of slugs) assert.match(s, /^[a-z]+(-[a-z]+)*$/);
});

test('every person has a bio in BOTH languages (2+ paragraphs) and a photo file', () => {
  for (const p of people) {
    for (const lang of ['en', 'id'] as const) {
      assert.ok(p.bio[lang].length >= 2, `${p.slug} ${lang} bio`);
      assert.ok(p.bio[lang].every((x) => x.trim().length > 40), `${p.slug} ${lang} paragraph`);
    }
    assert.ok(p.role.en && p.role.id, `${p.slug} role`);
    assert.ok(existsSync(new URL(`people/${p.photo}`, assetDir)), `${p.slug} photo ${p.photo}`);
  }
});

test('Indonesian bios are Indonesian, English bios are not', () => {
  for (const p of people) {
    assert.match(p.bio.id.join(' '), /\b(beliau|adalah|yang|dan)\b/i, `${p.slug} id`);
    assert.doesNotMatch(p.bio.en.join(' '), /\b(beliau|adalah)\b/i, `${p.slug} en`);
  }
});

test('eight advisors, each with two credential lines per language, and Verdi Yusuf is gone', () => {
  assert.equal(advisors.length, 8);
  assert.ok(!advisors.some((a) => /Verdi/i.test(a.name)));
  for (const a of advisors) {
    assert.equal(a.roles.en.length, 2, a.name);
    assert.equal(a.roles.id.length, 2, a.name);
  }
});

test('people who are not on the website are absent from all data', () => {
  const all = JSON.stringify({ people, advisors, areas, updates });
  for (const n of ['Lanny', 'Tohom', 'Verdi']) assert.ok(!all.includes(n), n);
});

test('every area of work points at a real photo', () => {
  for (const a of areas) assert.ok(a.photo in photos, `${a.slug} photo ${a.photo}`);
});

test('areas of work are in the order the client asked for', () => {
  assert.deepEqual(
    areas.map((a) => a.slug),
    [
      'health-nutrition',
      'food-system',
      'climate-environment',
      'education-capacity',
      'research-development',
      'monitoring-evaluation-learning',
    ],
  );
  assert.deepEqual(areas.map((a) => a.n), [1, 2, 3, 4, 5, 6]);
});

test('team groups appear in governance order', () => {
  assert.deepEqual(teamGroups.map((g) => g.key), ['trustees', 'advisors', 'management', 'supervisor']);
  assert.deepEqual(teamGroups.find((g) => g.key === 'management')?.people?.map((p) => p.slug), [
    'eriana-asri',
    'amir-syarifudin',
    'nurkhayati-darunifah',
    'intan-utoyo',
  ]);
});

test('every stock photo has alt text in both languages, a credit and a file on disk', () => {
  const keys = Object.keys(photos);
  assert.equal(keys.length, 23);
  for (const [key, p] of Object.entries(photos)) {
    assert.ok(p.alt.en.trim() && p.alt.id.trim(), `${key} alt`);
    assert.ok(p.credit.author.trim(), `${key} author`);
    assert.match(p.credit.url, /^https:\/\/unsplash\.com\/photos\/[\w-]+$/, `${key} credit url`);
    assert.ok(existsSync(new URL(`photos/${p.file}`, assetDir)), `${key} file ${p.file}`);
  }
});

test('every update points at a real photo key', () => {
  for (const u of updates) assert.ok(u.photo in photos, u.photo);
});

test('updates exist in both languages and carry no invented dates', () => {
  assert.equal(updates.length, 2);
  for (const u of updates) {
    assert.ok(u.title.en && u.title.id && u.summary.en && u.summary.id);
    assert.ok(!('date' in u));
  }
});

test('publications is a list; every entry has both titles and a file', () => {
  assert.ok(Array.isArray(publications));
  for (const p of publications) {
    assert.ok(p.title.en && p.title.id && p.file, p.slug);
    assert.ok(['report', 'brief', 'note'].includes(p.type), p.slug);
  }
});
