# COHESION Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual (EN/ID) static COHESION organization-profile site in Astro, in Direction E, with every client comment applied.

**Architecture:** One Astro project in `website/`. Pages live once under `src/pages/[...lang]/` and are generated for `en` (no prefix) and `id` (`/id/`). All copy is in two typed dictionaries; people, advisors, areas and updates are typed data files. One build-output check script enforces the spec's rules on `dist/`.

**Tech Stack:** Astro 5 (static, built-in i18n), TypeScript, plain CSS with tokens, vanilla JS for the slider, `@fontsource` Montserrat and Nunito Sans, `@astrojs/sitemap`, `puppeteer-core` (dev only, uses installed Chrome) for the layout check. Tests: `node --test` on `.ts` files (Node 22.23 strips types; use erasable TS only and `.ts` import suffixes).

**Spec:** `docs/superpowers/specs/2026-11-21-cohesion-website-design.md`. Read it first; its client-feedback table (rows 1-21) is the acceptance list.

## Global Constraints

- Astro, static output, `output: 'static'`, `trailingSlash: 'always'`, `build.format: 'directory'`.
- Locales `en` (default, no prefix) and `id` (`/id/`); `prefixDefaultLocale: false`. Every page exists in both.
- `site: 'https://cohesion-foundation.org'` is a single constant in `src/config.ts`; all internal links go through `localePath()`.
- Everything lives in `website/` (plus `docs/`). Do not touch other repo files. Never `git add -A`: two backup tarballs are staged and must not be committed. Add paths explicitly. Commit steps run only when the user has said to commit; end commit messages with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Brand: navy, teal, yellow, green taken from `cohesion logo and color pattern.png`. Headings Montserrat, body Nunito Sans. Photos black-and-white (CSS `grayscale(1)`) under a navy gradient.
- Sizes: body 17-18px, nav 16-17px, buttons 16px, eyebrow labels at least 14px. Vision and Mission text identical size and weight.
- Motion: hero slider crossfade, visitor-controlled, **no autoplay**; card lift and zoom on hover; `prefers-reduced-motion` limits motion to opacity fades.
- Photos: Unsplash only, stored in the repo, credited in `website/CREDITS.md` and the footer line "Photos: Unsplash".
- Contact values: phone `+62 8122 281026`, WhatsApp `https://wa.me/628122281026`, email `info@cohesion-foundation.org`, address `Ruko De Khirani No 3, Jl Bhakti ABRI, RT 04/RW 06, Kel. Sukamaju Baru, Kec. Tapos, Kota Depok, Jawa Barat 16455`. LinkedIn URL is unknown: the link is omitted when `config.linkedin` is empty, never rendered as a dead link.
- Removed from the design: top contact strip, hero brush strokes (all heroes), image tiles under the hero, "Since 2026 / Depok" badge, `Head [TBC]`, partner-logo placeholders, striped placeholder boxes, Lanny Yusnita, Tohom Sihombing, Verdi Yusuf.
- Area order everywhere: 01 Health and Nutrition, 02 Food System, 03 Climate and Environment, 04 Education and Capacity Development, 05 Research and Development, 06 Monitoring, Evaluation and Learning.
- WCAG 2.2 AA: 4.5:1 text contrast, visible focus, skip link, 44px touch targets, alt text on every image, no horizontal scroll from 360px.
- No invented facts. Copy comes from `~/Downloads/COHESION Profile_final.pdf` (wins over the mockup), the mockup PDF, and `~/Downloads/Profil Tim Cohesion_v2a.pdf`.

## Review Focus

1. **A person has a bio in one language only.** Build must fail, not fall back silently. Pinned in Task 3 (`data.test.ts`).
2. **Unknown or duplicate profile slug / the language toggle on a page with no twin.** Pinned in Task 1 (`altLocalePath`) and Task 11 (`check-build`: every `dist/` page has a twin; `/404` exists in both).
3. **Long names and credential lines on a 360px screen** (for example "Prof. dr. Muchtaruddin Mansyur, MS, SpOK, PhD." and the two-line advisor credentials). Pinned in Task 11 (`layout-check`: `scrollWidth <= innerWidth` on every page at 360px).
4. **JavaScript disabled or blocked.** Slider shows slide 1, nav and links still work. Pinned in Task 5 (slide 1 visible without the script in `check-build`: first slide has no `hidden`/`aria-hidden`).
5. **Dead or empty links** (`href=""`, `href="#"`, links to pages that do not exist, LinkedIn with no URL). Pinned in Task 11 (`check-build`).

---

## File Structure

```
website/
  package.json  astro.config.mjs  tsconfig.json  README.md  CREDITS.md
  public/COHESION-Organization-Profile.pdf  public/favicon.svg
  scripts/check-build.mjs        # rules over dist/, run after build
  scripts/layout-check.mjs       # puppeteer-core, 360/768/1280px overflow + screenshots
  src/config.ts                  # site url, phone, email, address, wa link, linkedin ('')
  src/i18n/index.ts              # locales, localePath, altLocalePath, pathLocale, t
  src/i18n/index.test.ts
  src/i18n/en.ts  src/i18n/id.ts # UI + page copy dictionaries (id must mirror en)
  src/data/types.ts              # L<T>, Person, Advisor, Area, Update
  src/data/people.ts  advisors.ts  areas.ts  updates.ts  photos.ts
  src/data/data.test.ts
  src/assets/people/*.jpg  src/assets/photos/*.jpg
  src/styles/global.css          # tokens, base, utilities
  src/layouts/Base.astro         # head, hreflang, header, footer, WA fab, skip link
  src/components/                # Header, Footer, LangToggle, WhatsAppFab, PageHero, Eyebrow,
                                 # HeroSlider, AreaCard, PersonCard, AdvisorCard, UpdateCard, IconTile
  src/pages/[...lang]/           # index, about/index, about/team/index, about/team/[slug],
                                 # our-work, resources, contact, 404
```

---

### Task 1: Scaffold, config, i18n helpers

**Files:** Create `website/package.json`, `astro.config.mjs`, `tsconfig.json`, `src/config.ts`, `src/i18n/index.ts`, `src/i18n/index.test.ts`, `src/i18n/en.ts`, `src/i18n/id.ts` (empty dictionary stubs for now).

**Interfaces:**
- Produces:
  - `type Locale = 'en' | 'id'`, `const locales`, `const defaultLocale: Locale`
  - `localePath(lang: Locale, path: string): string` (path starts and ends with `/`)
  - `altLocalePath(pathname: string): { lang: Locale; href: string }`
  - `pathLocale(pathname: string): Locale`
  - `t(lang: Locale): Dict` where `type Dict = typeof en`
  - `config` object in `src/config.ts` with `site`, `phone`, `email`, `whatsapp(lang): string`, `address`, `linkedin`

- [ ] **Step 1: Scaffold.** `npm create astro@latest website -- --template minimal --no-install --no-git --typescript strict`, then `cd website && npm i @fontsource/montserrat @fontsource/nunito-sans @astrojs/sitemap && npm i -D puppeteer-core @astrojs/check typescript`. Set `astro.config.mjs`: `site`, `trailingSlash: 'always'`, `build: { format: 'directory' }`, `i18n: { locales: ['en','id'], defaultLocale: 'en', routing: { prefixDefaultLocale: false } }`, sitemap integration with the i18n option. Scripts: `dev`, `build` (`astro check && astro build`), `test` (`node --test src/`), `check` (`node scripts/check-build.mjs`), `layout` (`node scripts/layout-check.mjs`).
- [ ] **Step 2: Run the ui-ux-pro-max stack guidance** and note anything that changes this plan: `python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "landing page static i18n images" --stack astro`. Apply results that fit; skip any that contradict the spec.
- [ ] **Step 3: Write failing tests in `src/i18n/index.test.ts`:**
  - `localePath('en','/about/') === '/about/'`; `localePath('id','/about/') === '/id/about/'`
  - `localePath('en','/') === '/'`; `localePath('id','/') === '/id/'`
  - `altLocalePath('/about/team/') ` returns `{lang:'id', href:'/id/about/team/'}`; `altLocalePath('/id/about/team/')` returns `{lang:'en', href:'/about/team/'}`; `altLocalePath('/id/')` returns `{lang:'en', href:'/'}`
  - `pathLocale('/id/contact/') === 'id'`, `pathLocale('/contact/') === 'en'`
  - dictionary parity: every key path of `en` exists in `id` and vice versa (write a small `keys(obj)` walker in the test).
- [ ] **Step 4: Run** `npm test` in `website/`. Expected: FAIL (module/functions missing).
- [ ] **Step 5: Implement** the helpers in `src/i18n/index.ts` and `src/config.ts` (`whatsapp(lang)` returns `https://wa.me/628122281026?text=` plus the URL-encoded starter message: EN "Hello, I would like to collaborate with COHESION. My name is ... from ... and we are working on ..."; ID "Halo, saya ingin berkolaborasi dengan COHESION. Nama saya ... dari ... dan kami sedang mengerjakan ...").
- [ ] **Step 6: Run** `npm test`. Expected: PASS. Run `npm run build` once on the empty scaffold. Expected: succeeds.
- [ ] **Step 7: Commit** `website/` scaffold only (explicit paths).

---

### Task 2: Design tokens, Base layout, header, footer, WhatsApp button

**Files:** Create `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/{Header,Footer,LangToggle,WhatsAppFab,Eyebrow,PageHero}.astro`, `public/favicon.svg`, `src/assets/logo.png` (cropped); minimal `src/pages/[...lang]/index.astro` to render the layout.

**Interfaces:**
- Consumes: `localePath`, `altLocalePath`, `t`, `config` (Task 1).
- Produces:
  - `Base.astro` props `{ lang: Locale; title: string; description: string; pathname: string }`
  - `PageHero.astro` props `{ lang: Locale; title: string; subtitle: string; image: ImageMetadata; crumb?: string }` (no brush strokes)
  - `Eyebrow.astro` slot component (14px+ uppercase label)
  - CSS custom properties: `--navy --teal --yellow --green --ink --paper --mist` and spacing/type scale

- [ ] **Step 1: Look at the design and logo.** View `cohesion logo and color pattern.png` and mockup page 2 (the Home screenshot). Crop the logo mark and wordmark to `src/assets/logo.png` (use `sips`), and read exact colour values from the pattern image into the tokens.
- [ ] **Step 2: Add a failing rule** to `scripts/check-build.mjs` (create the script with a `rules` array and a runner that prints each failure and exits 1): rule `shell`: every `dist/**/index.html` has `<html lang="en|id">` matching its path, a `rel="alternate" hreflang` pair, a skip link, a `wa.me/628122281026` link, no `Depok, Indonesia` text outside the footer address, and does not contain a top-strip element (`.topstrip`).
- [ ] **Step 3: Run** `npm run build && npm run check`. Expected: FAIL (no pages carry the shell yet).
- [ ] **Step 4: Implement** tokens, `Base.astro`, header (logo, Home, About Us, Our Work, Resources, Contact, ID | EN toggle, yellow **Collaborate** button to `/contact/`; active state; mobile menu using a native `<details>` or a checkbox-free button with `aria-expanded`), footer (logo, full address, email, phone, LinkedIn only if configured, organization profile download button, "Photos: Unsplash"), and the floating WhatsApp button (bottom-right, 56px, accessible name "Chat on WhatsApp" / "Chat di WhatsApp"). Fill the `nav`, `footer`, `common` keys in `en.ts` and `id.ts`.
- [ ] **Step 5: Copy** `~/Downloads/COHESION Profile_final.pdf` to `website/public/COHESION-Organization-Profile.pdf`. Try `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook` if Ghostscript exists; keep the original if the result is visibly worse.
- [ ] **Step 6: Run** `npm test && npm run build && npm run check`. Expected: PASS. Open `npm run dev` and check the shell at 390px and 1280px.
- [ ] **Step 7: Commit.**

---

### Task 3: Content data and bilingual bios

**Files:** Create `src/data/{types,people,advisors,areas,updates}.ts`, `src/data/data.test.ts`, `src/assets/people/{slug}.jpg`.

**Interfaces:**
- Produces:
  - `type L<T = string> = { en: T; id: T }`
  - `type Person = { slug: string; name: string; group: 'trustees' | 'management' | 'supervisor'; role: L; photo: ImageMetadata; bio: L<string[]> }`
  - `type Advisor = { name: string; roles: L<string[]> }`
  - `type Area = { n: 1|2|3|4|5|6; slug: string; name: L; blurb: L }`
  - `type Update = { slug: string; title: L; summary: L; tag: L; photo: ImageMetadata }`
  - `people: Person[]`, `advisors: Advisor[]`, `areas: Area[]`, `updates: Update[]`
  - `teamGroups: { key: 'trustees'|'advisors'|'management'|'supervisor'; title: L; people?: Person[] }[]` in display order

- [ ] **Step 1: Write failing tests in `src/data/data.test.ts`:**
  - `people.length === 7` and slugs are unique and kebab-case
  - every person has non-empty `bio.en` and `bio.id` (at least 2 paragraphs each) and a `photo`
  - `advisors.length === 8`; names exclude `Verdi Yusuf`; every advisor has 2 role lines in each language
  - no person or advisor is named `Lanny Yusnita` or `Tohom Sihombing`
  - `areas.map(a => a.slug)` equals `['health-nutrition','food-system','climate-environment','education-capacity','research-development','monitoring-evaluation-learning']`
  - `teamGroups.map(g => g.key)` equals `['trustees','advisors','management','supervisor']`
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Extract bios.** Page size from `pdfinfo`; crop each page's left (English) and right (Indonesian) halves with `pdftotext -f N -l N -x X -y Y -W W -H H`. Map pages to people (Elvina, Rozy, Eriana, Amir, Nurkhayati, Intan, Syaiful), split paragraphs on blank lines, and check by eye that no sentence is cut. Hand-fix hyphenation only; do not rewrite.
- [ ] **Step 4: Fill the data files.** Names, roles (EN/ID) and groups exactly as in the spec's Team page section. Role titles per the final profile: Chief, Member, Chair, Co-chair, Secretary, Treasurer, Supervisor; ID: Ketua, Anggota, Ketua, Wakil Ketua, Sekretaris, Bendahara, Pengawas. Advisor credential lines from the final profile (EN) with my Indonesian drafts. Area names/blurbs from the mockup and the final profile; the six division names in Indonesian (Kesehatan dan Gizi, Sistem Pangan, Iklim dan Lingkungan, Pendidikan dan Penguatan Kapasitas, Riset dan Pengembangan, Monitoring, Evaluasi, dan Pembelajaran). Updates: the two mockup entries (launch of Yayasan COHESION; first board meeting with advisors), no dates.
- [ ] **Step 5: Prepare photos.** Copy from `Foto Cohesion_Website/` to `src/assets/people/{slug}.jpg`, resized with `sips -Z 1400`: Bu_Elvina_Karyadi, Rozy_Afrial_Jafar, Eriana, Amir_Syarifudin, N_Darunifah, Intan_Budhi_Utoyo, Syaiful_Anwar. Do not copy Lanny or Tohom.
- [ ] **Step 6: Run** `npm test`. Expected: PASS.
- [ ] **Step 7: Commit.** Write `docs/superpowers/plans/id-copy-review.md` listing every Indonesian string drafted by Claude (advisor credentials, UI and page copy as later tasks add it) so the client can review. Update it in each page task.

---

### Task 4: Stock photos

**Files:** Create `src/assets/photos/*.jpg`, `src/data/photos.ts`, `website/CREDITS.md`.

**Interfaces:**
- Produces: `photos: Record<'hero1'|'hero2'|'hero3'|'aboutHero'|'workHero'|'contactHero'|'ctaBand'|'aboutA'|'aboutB'|'health'|'food'|'climate'|'education'|'update1'|'update2', { src: ImageMetadata; alt: L; credit: { author: string; url: string } }>`

- [ ] **Step 1: Failing test** added to `data.test.ts`: every `photos` entry has non-empty `alt.en`, `alt.id`, `credit.author` and an `https://unsplash.com/` credit URL.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Find photos with the Unsplash tools** (`search_photos`, then `download_asset` for chosen ones only). Subjects: Indonesian children and communities (hero, about), market with vegetables, rice paddy farmer, tropical forest, classroom, hands together. Prefer images matching the mockup's mood: portraits with faces, high contrast, good in black-and-white. Resize to max 2400px wide. Record author and photo URL in `photos.ts` and `CREDITS.md`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 5: Home page

**Files:** Create `src/components/{HeroSlider,AreaCard,IconTile}.astro` as needed, `src/pages/[...lang]/index.astro` (replace the stub).

**Interfaces:**
- Consumes: `Base`, `Eyebrow`, `areas`, `photos`, `t`, `localePath`.
- Produces: `HeroSlider.astro` props `{ lang: Locale; slides: { image: ImageMetadata; alt: string; tag: string; title: string; text: string }[] }`

- [ ] **Step 1: Add rules to `check-build.mjs`** (rule `home`): both `/` and `/id/` contain the hero `<h1>`; exactly 3 slides with only the first not `hidden`/`aria-hidden`; no autoplay (no `setInterval`/`autoplay` in the bundled slider script); six area cards in the order of the Global Constraints; Vision and Mission elements share one CSS class; no `Since 2026`, no "Depok" badge; the final band label reads `Collaborate` / `Kolaborasi` and links to `/contact/` (`/id/contact/`); a "Download Organization Profile" link to `/COHESION-Organization-Profile.pdf`.
- [ ] **Step 2: Run** `npm run build && npm run check`. Expected: FAIL on `home`.
- [ ] **Step 3: Implement** the sections of mockup E1 in order, minus the removed parts: hero slider (3 slides, crossfade, prev/next/dots, arrow keys, no autoplay), About block (two overlapping photos, yellow accent, three tick lines, "More about us" and the profile download button), Vision | Mission band (same type size), Six areas grid (numbered, yellow top border), News from our work (two update cards + "Meet the team" card linking to the Team page), Collaborate band (WhatsApp button), then footer. Copy from the final profile and mockup; Indonesian copy drafted into `id.ts` and `id-copy-review.md`.
- [ ] **Step 4: Run** build and check. Expected: PASS. Check 390px and 1280px visually against mockup E1.
- [ ] **Step 5: Commit.**

---

### Task 6: About Us page

**Files:** Create `src/pages/[...lang]/about/index.astro`, `src/components/IconTile.astro` if not made.

- [ ] **Step 1: Add rules** (`about`): both languages have the "Meet our team" link to `/about/team/`; six division names present, no `Head`, no `[TBC]`; Notarial Deed card present; no `Lanny`, `Tohom`, `Verdi`; no timeline or org-chart markup; six illustration tiles with accessible labels (wheat, rice, salt, environment, healthy plate, school bench).
- [ ] **Step 2: Run** `npm run build && npm run check`. Expected: FAIL.
- [ ] **Step 3: Implement** mockup E2 sections: hero with breadcrumb (no brush strokes), Background text from the final profile, illustration tiles (`IconTile` props `{ icon: 'wheat'|'rice'|'salt'|'leaf'|'plate'|'school'; label: string }`; use simple inline SVGs, hand-draw the salt one), Notarial Deed card, Divisions grid (names only, ordered per Global Constraints), a band linking to the Team page.
- [ ] **Step 4: Run** build and check. Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 7: Team page and profile pages

**Files:** Create `src/components/{PersonCard,AdvisorCard}.astro`, `src/pages/[...lang]/about/team/index.astro`, `src/pages/[...lang]/about/team/[slug].astro`.

**Interfaces:**
- Consumes: `people`, `advisors`, `teamGroups`, `Base`, `PageHero`.
- Produces: `PersonCard` props `{ person: Person; lang: Locale }` (whole card is one link to `/about/team/{slug}/`); `AdvisorCard` props `{ advisor: Advisor; lang: Locale }` (no link).

- [ ] **Step 1: Add rules** (`team`): `/about/team/` and `/id/about/team/` list the four groups in order; 7 person cards, each link resolves to a built page; 8 advisor cards with no link; each profile page contains the person's name, role, photo with alt, a back link, and the bio in the page's language (check one distinctive Indonesian word per language, for example `Beliau` on `/id/` pages and absent on English pages).
- [ ] **Step 2: Run** `npm run build && npm run check`. Expected: FAIL.
- [ ] **Step 3: Implement** the CISDI pattern: page title + intro, then per group a heading with a divider and a responsive grid of cards (photo, name, role). Profile page: breadcrumb, large photo, name, role, bio paragraphs, "Back to team". `getStaticPaths` returns the product of `[undefined, 'id']` and `people`.
- [ ] **Step 4: Run** build and check. Expected: PASS. Look at the page next to https://cisdi.org/tentang-cisdi/tim-cisdi.
- [ ] **Step 5: Commit.**

---

### Task 8: Our Work page

**Files:** Create `src/components/UpdateCard.astro`, `src/pages/[...lang]/our-work.astro`.

- [ ] **Step 1: Add rules** (`work`): six area cards in order; three approach cards (Evidence and Learning, Technical Support, Partnerships and Engagement) with the final profile wording; two update cards, not links, no `[DD MMM`; "Updates" eyebrow at least 14px in CSS.
- [ ] **Step 2: Run** build and check. Expected: FAIL.
- [ ] **Step 3: Implement** mockup E3: hero, Activities and stories, Where we focus (four photo cards plus two solid cards for R&D and MEL, per the mockup), Our approach (navy, teal, green cards).
- [ ] **Step 4: Run** build and check. Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 9: Resources page

**Files:** Create `src/pages/[...lang]/resources.astro`; add `publications: Publication[]` (empty) and `type Publication = { slug: string; title: L; type: 'report'|'brief'|'note'; file: string }` to `src/data/types.ts` and a new `src/data/publications.ts`.

- [ ] **Step 1: Add rule** (`resources`): with `publications` empty the page shows the "No publications yet" state and **no** filter tabs; the LinkedIn button appears only if `config.linkedin` is set (otherwise the state text has no dead button). Add a unit test in `data.test.ts`: `publications` is an array.
- [ ] **Step 2: Run** build, check, test. Expected: FAIL.
- [ ] **Step 3: Implement** mockup E4: hero, empty state; tabs (All, Reports, Policy briefs, Learning notes) render only when `publications.length > 0`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 10: Contact page

**Files:** Create `src/pages/[...lang]/contact.astro`.

- [ ] **Step 1: Add rules** (`contact`): hero contains the WhatsApp CTA and the starter-message card; cards appear in this order: Office, Email, WhatsApp, LinkedIn (LinkedIn omitted when unset); address text equals `config.address`; the profile download button is present; the map `<iframe>` has a `title` and `loading="lazy"`.
- [ ] **Step 2: Run** build and check. Expected: FAIL.
- [ ] **Step 3: Implement** mockup E5 with the new order. Map: `https://www.google.com/maps?q=<encoded address>&output=embed`. `mailto:` and `tel:` links where relevant.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 11: 404, SEO, layout and quality gate

**Files:** Create `src/pages/[...lang]/404.astro`, `scripts/layout-check.mjs`, `website/README.md`; modify `scripts/check-build.mjs`.

- [ ] **Step 1: Add global rules to `check-build.mjs`** (rule `global`): every English page in `dist/` has an Indonesian twin and vice versa; every internal `href`/`src` resolves to a file in `dist/`; no `href=""` or `href="#"`; every `<img>` has an `alt` attribute; no `[TBC]`, `placeholder`, `Lorem`, `TODO`, `Verdi`, `Lanny`, `Tohom` in page text; `sitemap-index.xml` exists; each page has `<title>`, meta description and Open Graph tags; `/404/` and `/id/404/` exist.
- [ ] **Step 2: Implement** the 404 page (both languages, links home) and any fixes the global rules expose. Run `npm run build && npm run check` until PASS.
- [ ] **Step 3: Write `scripts/layout-check.mjs`:** start `astro preview`, open every page with `puppeteer-core` using `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` at widths 360, 768 and 1280, fail if `document.documentElement.scrollWidth > window.innerWidth`, save full-page screenshots to `website/.layout-shots/` (gitignored) and print their paths.
- [ ] **Step 4: Run** `npm run layout`. Expected: PASS at all widths. Fix any overflow (long names, advisor credential lines).
- [ ] **Step 5: Visual review.** Compare screenshots with mockup pages E1-E5 and walk the spec's client-feedback table rows 1-21, ticking each. Run through the ui-ux-pro-max checklist (`references/quick-reference.md` sections 1-7: accessibility, touch, performance, layout, type and colour, animation). Check keyboard-only use of the nav, language toggle and slider, and `prefers-reduced-motion`.
- [ ] **Step 6: Write `website/README.md`:** commands, where to edit copy, how to add a person, advisor, update or publication, how to swap photos, and the open client items from the spec.
- [ ] **Step 7: Run** `npm test && npm run build && npm run check && npm run layout`. Expected: all pass. Report evidence to the user.
- [ ] **Step 8: Commit.**

---

## Self-Review

- **Spec coverage:** Routing, header and footer, WA button (Task 2); client rows 1-21 are covered: photos (4), strip/strokes/tiles/badge/labels/fonts/order/collaborate/WA/address (2, 5), stats alternative, advisors, divisions, removed people, profile links (3, 6, 7), Contact order and download button (10), Team page (7). Resources empty state (9). Quality bar and checks (11). Open client items are in the README (11).
- **Type consistency:** `L`, `Person`, `Advisor`, `Area`, `Update`, `Locale`, `localePath` are defined once (Tasks 1, 3) and used with the same names later.
- **Proportion:** Plan is a decision list; bodies are left to the implementer except the WhatsApp text and the Indonesian division names the spec fixes.
