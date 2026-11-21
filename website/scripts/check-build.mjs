// Rules over the built site in dist/. Run: npm run build && npm run check
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { people } from '../src/data/people.ts';
import { config } from '../src/config.ts';

const DIST = new URL('../dist/', import.meta.url).pathname;
const PROFILE = '/COHESION-Organization-Profile.pdf';

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** route -> html, e.g. "/id/about/" */
const pages = {};
for (const f of walk(DIST).filter((f) => f.endsWith('index.html'))) {
  const route = '/' + relative(DIST, f).replace(/index\.html$/, '');
  pages[route] = readFileSync(f, 'utf8');
}
const routes = Object.keys(pages).sort();
const enRoutes = routes.filter((r) => !r.startsWith('/id/') && r !== '/id/');
const idRoute = (r) => (r === '/' ? '/id/' : '/id' + r);
const text = (html) =>
  html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const count = (html, re) => (html.match(re) || []).length;
const both = (route) => [pages[route], pages[idRoute(route)]];

const rules = {
  shell() {
    const f = [];
    for (const r of routes) {
      const h = pages[r];
      const lang = r.startsWith('/id/') ? 'id' : 'en';
      if (!h.includes(`<html lang="${lang}"`)) f.push(`${r}: html lang should be ${lang}`);
      if (!/hreflang="en"/.test(h) || !/hreflang="id"/.test(h)) f.push(`${r}: missing hreflang pair`);
      if (!h.includes('class="skip-link"')) f.push(`${r}: missing skip link`);
      if (!h.includes('wa.me/628122281026')) f.push(`${r}: missing WhatsApp link`);
      if (h.includes('topstrip')) f.push(`${r}: top contact strip must be removed`);
      if (!h.includes('Kec. Tapos')) f.push(`${r}: footer lacks full address`);
      if (!h.includes(PROFILE)) f.push(`${r}: missing profile download link`);
    }
    return f;
  },

  home() {
    const f = [];
    const AREA_ORDER = ['health-nutrition', 'food-system', 'climate-environment', 'education-capacity', 'research-development', 'monitoring-evaluation-learning'];
    for (const [r, h] of [['/', pages['/']], ['/id/', pages['/id/']]]) {
      if (!h) { f.push(`${r}: page missing`); continue; }
      const lang = r === '/' ? 'en' : 'id';
      if (count(h, /<h1[\s>]/g) !== 1) f.push(`${r}: expected exactly one <h1>`);
      const slides = h.match(/<div class="slide[^"]*"[^>]*data-slide[^>]*>/g) || [];
      if (slides.length !== 3) f.push(`${r}: expected 3 slides, found ${slides.length}`);
      else if (/aria-hidden/.test(slides[0]) || !slides.slice(1).every((s) => /aria-hidden="true"/.test(s))) f.push(`${r}: only the first slide may be visible without JavaScript`);
      const order = [...h.matchAll(/data-area="([a-z-]+)"/g)].map((m) => m[1]);
      if (order.join() !== AREA_ORDER.join()) f.push(`${r}: area cards out of order: ${order.join(',')}`);
      if (count(h, /class="statement[ "]/g) !== 2) f.push(`${r}: vision and mission must share the "statement" class`);
      if (/Since 2026/i.test(h)) f.push(`${r}: "Since 2026" badge must be removed`);
      if (h.includes('hero-tiles')) f.push(`${r}: image tiles under the hero must be removed`);
      const contact = lang === 'en' ? 'href="/contact/"' : 'href="/id/contact/"';
      const band = h.match(/<section[^>]*id="collaborate"[\s\S]*?<\/section>/)?.[0] || '';
      if (!band) f.push(`${r}: collaborate band missing`);
      else {
        if (!new RegExp(lang === 'en' ? '>\\s*Collaborate\\s*<' : '>\\s*Berkolaborasi\\s*<').test(band)) f.push(`${r}: collaborate band label wrong`);
        if (!band.includes('wa.me/628122281026')) f.push(`${r}: collaborate band lacks WhatsApp button`);
      }
      if (band && !band.includes(contact)) f.push(`${r}: collaborate band must link to the contact page`);
      const slider = h.match(/<section class="slider[\s\S]*?<\/section>/)?.[0] || '';
      if (/<h1[\s>]/.test(slider)) f.push(`${r}: the <h1> must live outside the slider (slides become inert)`);
      if (count(h, /class="[^"]*photo-bw/g) < 3) f.push(`${r}: photos must be black and white (photo-bw)`);
    }
    const inline = Object.values(pages).map((h) => (h.match(/<script[\s\S]*?<\/script>/g) || []).join('\n')).join('\n');
    const js = walk(DIST).filter((p) => p.endsWith('.js')).map((p) => readFileSync(p, 'utf8')).join('\n') + inline;
    if (!/data-prev/.test(js)) f.push('slider script not found in dist, so the autoplay check cannot see it');
    if (/setInterval|autoplay/i.test(js)) f.push('scripts: slider must not autoplay');
    return f;
  },

  about() {
    const f = [];
    const AREA_ORDER = ['health-nutrition', 'food-system', 'climate-environment', 'education-capacity', 'research-development', 'monitoring-evaluation-learning'];
    for (const [r, lang] of [['/about/', 'en'], ['/id/about/', 'id']]) {
      const h = pages[r];
      if (!h) { f.push(`${r}: page missing`); continue; }
      if (count(h, /<h1[\s>]/g) !== 1) f.push(`${r}: expected exactly one <h1>`);
      const team = lang === 'en' ? 'href="/about/team/"' : 'href="/id/about/team/"';
      if (!h.includes(team)) f.push(`${r}: no link to the team page`);
      const divs = [...h.matchAll(/data-division="([a-z-]+)"/g)].map((m) => m[1]);
      if (divs.join() !== AREA_ORDER.join()) f.push(`${r}: divisions wrong or out of order: ${divs.join(',')}`);
      const t = text(h);
      for (const bad of ['Head:', '[TBC]', 'Lanny', 'Tohom', 'Verdi']) if (t.includes(bad)) f.push(`${r}: must not contain "${bad}"`);
      for (const bad of ['Notarial Deed', 'Akta Notaris', 'Nurlela', 'Nurtela']) if (t.includes(bad)) f.push(`${r}: the notarial deed card was removed at the client's request; found "${bad}"`);
      if (!t.includes(lang === 'en' ? 'broad range of stakeholders' : 'beragam pemangku kepentingan')) f.push(`${r}: About text must come from the final organization profile`);
      if (h.includes('timeline')) f.push(`${r}: the old timeline structure must be gone`);
      const tiles = [...h.matchAll(/data-tile="([a-z]+)"/g)].map((m) => m[1]);
      if (tiles.join() !== 'wheat,rice,salt,leaf,plate,school') f.push(`${r}: illustration tiles wrong: ${tiles.join(',')}`);
      if (/class="tile__label/.test(h)) f.push(`${r}: tile photos must not carry text`);
      const tileHtml = [...h.matchAll(/<li class="tile[^>]*data-tile="[a-z]+"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
      if (tileHtml.length !== 6 || tileHtml.some((x) => !/<img [^>]*alt="[^"]+"/.test(x))) f.push(`${r}: every tile must show a photo with alt text`);
      if (tileHtml.some((x) => x.replace(/<img [^>]*>/g, '').replace(/<[^>]+>/g, '').trim())) f.push(`${r}: tiles must show no text over or beside the photos`);
      if (tileHtml.some((x) => /<svg/.test(x))) f.push(`${r}: tiles must not use svg icons`);
    }
    return f;
  },

  team() {
    const f = [];
    for (const [r, lang] of [['/about/team/', 'en'], ['/id/about/team/', 'id']]) {
      const h = pages[r];
      if (!h) { f.push(`${r}: page missing`); continue; }
      const t0 = text(h);
      const wrong = lang === 'en' ? ['Pembina', 'Penasihat', 'Pengurus', 'Pengawas'] : ['Board of Trustees', 'Board of Advisors', 'Board of Management', 'Board of Supervisors'];
      for (const w of wrong) if (t0.includes(w)) f.push(`${r}: group names must be in the page language only, found "${w}"`);
      for (const w of ['being prepared', 'sedang disiapkan']) if (t0.includes(w)) f.push(`${r}: remove the "advisors are being prepared" note, found "${w}"`);
      const groups = [...h.matchAll(/data-group="([a-z]+)"/g)].map((m) => m[1]);
      if (groups.join() !== 'trustees,advisors,management,supervisor') f.push(`${r}: groups wrong: ${groups.join(',')}`);
      const cards = [...h.matchAll(/data-person="([a-z-]+)"/g)].map((m) => m[1]);
      if (cards.join() !== people.map((p) => p.slug).join()) f.push(`${r}: person cards wrong: ${cards.join(',')}`);
      for (const p of people) {
        const href = (lang === 'en' ? '' : '/id') + `/about/team/${p.slug}/`;
        if (!h.includes(`href="${href}"`)) f.push(`${r}: no link to ${href}`);
        if (!pages[href]) f.push(`${href}: profile page missing`);
      }
      const adv = h.match(/<article[^>]*data-advisor[\s\S]*?<\/article>/g) || [];
      if (adv.length !== 8) f.push(`${r}: expected 8 advisor cards, found ${adv.length}`);
      if (adv.some((a) => /<a[\s>]/.test(a))) f.push(`${r}: advisor cards must not be links`);
    }
    for (const p of people) {
      for (const lang of ['en', 'id']) {
        const r = (lang === 'en' ? '' : '/id') + `/about/team/${p.slug}/`;
        const h = pages[r];
        if (!h) continue;
        const t = text(h);
        if (!new RegExp(`<h1[^>]*>\\s*${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</h1>`).test(h)) f.push(`${r}: h1 must be the person's name`);
        if (!t.includes(p.role[lang])) f.push(`${r}: role missing`);
        if (!/<img[^>]*alt="[^"]+"/.test(h.replace(/<header[\s\S]*?<\/header>/, ''))) f.push(`${r}: portrait needs alt text`);
        if (!h.includes(`href="${lang === 'en' ? '' : '/id'}/about/team/"`)) f.push(`${r}: no back link`);
        const bio0 = p.bio[lang][0].slice(0, 60);
        if (!t.includes(bio0)) f.push(`${r}: bio not in ${lang}`);
        if (lang === 'en' && /\bBeliau\b/.test(t)) f.push(`${r}: Indonesian text on English page`);
      }
    }
    return f;
  },

  work() {
    const f = [];
    const AREA_ORDER = ['health-nutrition', 'food-system', 'climate-environment', 'education-capacity', 'research-development', 'monitoring-evaluation-learning'];
    for (const [r] of [['/our-work/', 'en'], ['/id/our-work/', 'id']]) {
      const h = pages[r];
      if (!h) { f.push(`${r}: page missing`); continue; }
      if (count(h, /<h1[\s>]/g) !== 1) f.push(`${r}: expected exactly one <h1>`);
      const order = [...h.matchAll(/data-focus="([a-z-]+)"/g)].map((m) => m[1]);
      if (order.join() !== AREA_ORDER.join()) f.push(`${r}: focus cards wrong: ${order.join(',')}`);
      if (count(h, /data-solid/g) !== 0) f.push(`${r}: every focus card needs a photo (R&D and MEL were solid until the client asked for photos)`);
      const cards = h.match(/<article class="focus[\s\S]*?<\/article>/g) || [];
      if (cards.length !== 6 || cards.some((c) => !/<img /.test(c))) f.push(`${r}: all six focus cards must show a photo`);
      const ap = [...h.matchAll(/data-approach="([a-z]+)"/g)].map((m) => m[1]);
      if (ap.join() !== 'evidence,technical,partnerships') f.push(`${r}: approach cards wrong: ${ap.join(',')}`);
      const ups = h.match(/<article class="update[\s\S]*?<\/article>/g) || [];
      if (ups.length !== 2) f.push(`${r}: expected 2 update cards, found ${ups.length}`);
      if (ups.some((u) => /<a[\s>]/.test(u))) f.push(`${r}: update cards must not be links yet`);
      if (/\[DD|DD MMM/.test(h)) f.push(`${r}: placeholder date`);
    }
    return f;
  },

  type() {
    const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
    const rem = (name) => parseFloat(css.match(new RegExp(`--${name}:\\s*([\\d.]+)rem`))?.[1] ?? '0');
    const f = [];
    if (rem('step-eyebrow') < 0.875) f.push('eyebrow labels must be at least 14px (0.875rem)');
    if (rem('step-body') < 1.0625) f.push('body text must be at least 17px (1.0625rem)');
    if (rem('step-small') < 0.9375) f.push('small text must be at least 15px');
    const focus = css.match(/:focus-visible\s*\{[^}]*\}/)?.[0] ?? '';
    if (!/navy/.test(focus)) f.push('focus ring needs a dark colour: yellow alone is 1.8:1 on white (WCAG 1.4.11 needs 3:1)');
    const home = readFileSync(new URL('../src/pages/[...lang]/index.astro', import.meta.url), 'utf8');
    if (/\.cta :global\(\.eyebrow\)\s*\{\s*color:\s*var\(--yellow\)/.test(home)) f.push('yellow eyebrow on the teal band is 3.5:1, needs 4.5:1');
    return f;
  },

  resources() {
    const f = [];
    for (const [r] of [['/resources/'], ['/id/resources/']]) {
      const h = pages[r];
      if (!h) { f.push(`${r}: page missing`); continue; }
      if (count(h, /<h1[\s>]/g) !== 1) f.push(`${r}: expected exactly one <h1>`);
      if (!h.includes('data-empty')) f.push(`${r}: empty state missing while there are no publications`);
      if (/role="tablist"|data-filter/.test(h)) f.push(`${r}: filter tabs must not render without publications`);
      if (!config.linkedin && /linkedin\.com/i.test(h)) f.push(`${r}: LinkedIn link rendered although config.linkedin is empty`);
    }
    return f;
  },

  contact() {
    const f = [];
    for (const [r, lang] of [['/contact/', 'en'], ['/id/contact/', 'id']]) {
      const h = pages[r];
      if (!h) { f.push(`${r}: page missing`); continue; }
      if (count(h, /<h1[\s>]/g) !== 1) f.push(`${r}: expected exactly one <h1>`);
      const hero = h.match(/<section[^>]*data-contact-hero[\s\S]*?<\/section>/)?.[0] || '';
      if (!hero.includes('wa.me/628122281026')) f.push(`${r}: hero lacks the WhatsApp button`);
      if (!hero.includes(config.whatsappMessage[lang].slice(0, 20))) f.push(`${r}: starter message card missing`);
      if (!hero.includes(config.profilePdf)) f.push(`${r}: hero lacks the profile download button`);
      const order = [...h.matchAll(/data-contact="([a-z]+)"/g)].map((m) => m[1]);
      const want = config.linkedin ? 'office,email,whatsapp,linkedin' : 'office,email,whatsapp';
      if (order.join() !== want) f.push(`${r}: contact cards should be ${want}, got ${order.join()}`);
      if (!text(h).includes(config.address)) f.push(`${r}: full office address missing`);
      const map = h.match(/<iframe[^>]*>/)?.[0] || '';
      if (!/title="[^"]+"/.test(map) || !/loading="lazy"/.test(map)) f.push(`${r}: map iframe needs a title and loading=lazy`);
    }
    return f;
  },

  global() {
    const f = [];
    // every English page has an Indonesian twin and the other way round
    for (const r of enRoutes) if (!pages[idRoute(r)]) f.push(`${r}: no Indonesian twin ${idRoute(r)}`);
    for (const r of routes.filter((x) => x.startsWith('/id/'))) {
      const en = r === '/id/' ? '/' : r.slice(3);
      if (!pages[en]) f.push(`${r}: no English twin ${en}`);
    }
    for (const must of ['/404/', '/id/404/']) if (!pages[must]) f.push(`${must}: missing`);
    if (!existsSync(DIST + 'sitemap-index.xml')) f.push('sitemap-index.xml missing');
    if (!existsSync(DIST + '404.html')) f.push('404.html missing (static hosts look for /404.html)');
    for (const r of routes.filter((x) => x.startsWith('/id/'))) {
      if (/aria-label="Breadcrumb"|aria-roledescription="carousel"/.test(pages[r])) f.push(`${r}: English aria text on an Indonesian page`);
    }
    if (!config.linkedin) for (const r of routes) if (/linkedin\.com/i.test(pages[r])) f.push(`${r}: LinkedIn link although config.linkedin is empty`);
    const banned = ['[TBC]', 'placeholder', 'Lorem', 'TODO', 'Verdi', 'Lanny', 'Tohom', 'Head:'];
    for (const r of routes) {
      const h = pages[r];
      if (/href=""|href="#"/.test(h)) f.push(`${r}: empty or "#" link`);
      for (const img of h.match(/<img\b[^>]*>/g) || []) if (!/\balt(?:=|\s|\/|>)/.test(img)) f.push(`${r}: <img> without alt: ${img.slice(0, 80)}`);
      const t = text(h);
      for (const b of banned) if (t.includes(b)) f.push(`${r}: contains "${b}"`);
      if (!/<title>[^<]+<\/title>/.test(h)) f.push(`${r}: no <title>`);
      if (!/<meta name="description" content="[^"]+"/.test(h)) f.push(`${r}: no meta description`);
      if (!/property="og:title"/.test(h) || !/property="og:description"/.test(h)) f.push(`${r}: Open Graph tags missing`);
      if (!/rel="canonical"/.test(h)) f.push(`${r}: no canonical link`);
      for (const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)[^"]*"/g)) {
        const u = m[1];
        if (u.startsWith('//')) continue;
        const ok = u.endsWith('/') ? existsSync(DIST + u.slice(1) + 'index.html') : existsSync(DIST + u.slice(1));
        if (!ok) f.push(`${r}: dead link ${u}`);
      }
    }
    return f;
  },
};

const only = process.argv[2];
let failures = [];
for (const [name, rule] of Object.entries(rules)) {
  if (only && only !== name) continue;
  for (const msg of rule()) failures.push(`[${name}] ${msg}`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`\n${failures.length} failure(s) across ${routes.length} page(s)`);
  process.exit(1);
}
console.log(`ok: ${Object.keys(rules).length} rule group(s), ${routes.length} page(s)`);
export { pages, routes, enRoutes, idRoute, text, count, both, DIST, existsSync };
