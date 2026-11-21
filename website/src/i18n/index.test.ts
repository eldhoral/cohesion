import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localePath, altLocalePath, pathLocale } from './index.ts';
import { en } from './en.ts';
import { id } from './id.ts';

function keys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

test('localePath leaves English paths unprefixed', () => {
  assert.equal(localePath('en', '/about/'), '/about/');
  assert.equal(localePath('en', '/'), '/');
});

test('localePath prefixes Indonesian paths with /id', () => {
  assert.equal(localePath('id', '/about/'), '/id/about/');
  assert.equal(localePath('id', '/'), '/id/');
  assert.equal(localePath('id', '/about/team/'), '/id/about/team/');
});

test('altLocalePath swaps language and keeps the page', () => {
  assert.deepEqual(altLocalePath('/about/team/'), { lang: 'id', href: '/id/about/team/' });
  assert.deepEqual(altLocalePath('/id/about/team/'), { lang: 'en', href: '/about/team/' });
  assert.deepEqual(altLocalePath('/id/'), { lang: 'en', href: '/' });
  assert.deepEqual(altLocalePath('/'), { lang: 'id', href: '/id/' });
});

test('pathLocale reads the language from the path', () => {
  assert.equal(pathLocale('/id/contact/'), 'id');
  assert.equal(pathLocale('/contact/'), 'en');
  assert.equal(pathLocale('/id/'), 'id');
  assert.equal(pathLocale('/identity/'), 'en');
});

test('Indonesian dictionary mirrors the English one key for key', () => {
  assert.deepEqual(keys(id).sort(), keys(en).sort());
});
