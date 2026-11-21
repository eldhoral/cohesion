import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initials } from './initials.ts';
import { advisors } from './advisors.ts';

test('initials are first and last name, skipping titles and degrees', () => {
  assert.equal(initials('Ir. Adhi S. Lukman'), 'AL');
  assert.equal(initials('Dr. Ir. Albertus Sulaiman, SSi, MSi.'), 'AS');
  assert.equal(initials('Prof. dr. Muchtaruddin Mansyur, MS, SpOK, PhD.'), 'MM');
  assert.equal(initials('Donny Utoyo, ST. MSi.'), 'DU');
});

test('no two advisors share initials', () => {
  const all = advisors.map((a) => initials(a.name));
  assert.equal(new Set(all).size, all.length, all.join(','));
});
