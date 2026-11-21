# COHESION website

Static bilingual (English / Indonesian) site for Yayasan COHESION, built with [Astro](https://astro.build). Design: Direction E, "Bold Photo Charity". Spec and plan: `../docs/superpowers/`.

## Commands

| Command | What it does |
|---|---|
| `npm install` | install dependencies |
| `npm run dev` | dev server at http://localhost:4321 |
| `npm run build` | type-check (`astro check`) and build to `dist/` |
| `npm test` | unit tests for the i18n helpers and the data files |
| `npm run check` | rules over `dist/` (run after a build): twins in both languages, no dead links, alt text, no placeholders, SEO tags, per-page rules |
| `npm run layout` | opens every page in Chrome at 360, 768 and 1280px, fails on horizontal scroll, saves screenshots to `.layout-shots/` (needs Google Chrome) |

Deploy the `dist/` folder to any static host. English pages are at `/`, Indonesian at `/id/`. The 404 page is `dist/404.html` (a copy of `dist/404/index.html`); Netlify, Cloudflare Pages and GitHub Pages pick it up on their own. For nginx: `error_page 404 /404.html;`.

## Where things live

- `src/i18n/en.ts`, `src/i18n/id.ts`: all page copy. The two files must have the same keys (a test enforces this).
- `src/data/people.ts`: the seven people with bios (English and Indonesian) and photos in `src/assets/people/`.
- `src/data/advisors.ts`, `areas.ts`, `updates.ts`, `publications.ts`: the other content.
- `src/data/photos.ts` and `src/assets/photos/`: stock photos with alt text and credits (`CREDITS.md`).
- `src/config.ts`: site URL, phone, email, address, LinkedIn, WhatsApp message.
- `public/COHESION-Organization-Profile.pdf`: the download button file.

## Common edits

- **Add a LinkedIn link:** set `linkedin` in `src/config.ts`. The link appears in the footer, on Contact and on Resources. While it is empty no LinkedIn link is rendered.
- **Add a person:** add an entry to `people` in `src/data/people.ts` (slug, name, group, role, photo file in `src/assets/people/`, bio in both languages). The card, the profile page and the Indonesian twin appear automatically.
- **Add an advisor photo and profile:** move the advisor from `advisors.ts` into `people.ts` with a new group, or ask for the card to become a link.
- **Add a news item:** add to `updates.ts` (needs a photo key from `photos.ts`).
- **Add a publication:** put the PDF in `public/publications/` and add an entry to `publications.ts`. The empty state on Resources goes away.
- **Replace stock photos with foundation photos:** drop the new file into `src/assets/photos/` under the same name, update alt text and credit in `src/data/photos.ts`.

## Open items for the client

1. The real LinkedIn URL.
2. Whether the organization profile PDF will get an Indonesian version.
3. Real dates, photos and text for the two updates on Our Work and Home.
4. Review of the Indonesian copy (list in `../docs/superpowers/plans/id-copy-review.md`).
5. Confirm the illustration tiles on About Us (wheat, rice, salt, environment, healthy plate, school bench) are what Eriana meant by "alternatives".
6. Confirm the Notarial Deed card and the "rooted in Depok" wording stay on About Us.
7. Which host is canonical: `cohesion-foundation.org` (used now) or `www.`; change `site` in `astro.config.mjs` and `src/config.ts`.
