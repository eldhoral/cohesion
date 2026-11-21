# COHESION organization profile website: design

Date: 2026-11-21. Status: draft, awaiting approval.

## Intent and why

Yayasan COHESION (Center of Health, Environment, Sustainable Innovation, Outreach and Nutrition) was established
on 28 October 2026 in Depok, Indonesia. It needs a public landing site that presents the organization to
government, development partners, donors and academia, and gives them one clear way to get in touch
(WhatsApp first). The client's team already chose a design, **Direction E, "Bold Photo Charity"**
(Drive file `COHESION-Direction-E-Bold-Photo-Charity.pdf`, copy in `~/Downloads`; older copy in `mockups-pdf/`),
and the client (Eriana Asri, Amir Syarifudin) left 21 review comment threads on it (21 highlights, some with replies). This document records the design
plus every comment, resolved into a decision.

## Goals

- A 5-page site (Home, About Us, Our Work, Resources, Contact) plus a Team page and one profile page per
  person who has a bio, faithful to Direction E and with every client comment applied.
- Fully bilingual: English and Indonesian, switchable on every page.
- Fast, static, accessible (WCAG 2.2 AA), good on phones.
- Easy for the next developer to extend: adding a person, an update or a publication means adding an entry
  to a data file, not editing page code.

## Non-goals

- No CMS, no database, no backend, no contact form (WhatsApp and email links only), no analytics, no newsletter,
  no site search, no comments.
- No article pages for "Activities and stories" until the client has real articles.
- No partner-logo strip (no partners supplied; the mockup's striped placeholders are not shipped).
- No advisor photos or bios (the client says these are still being developed).
- No server, DNS or deployment work. The output is a static `dist/` folder.

## Anti-goals

- Striped "[placeholder]" boxes or `[TBC]` labels visible on the live site.
- Invented facts: no made-up dates, partners, statistics or biographies. Content comes only from the client's
  documents.
- Copyright risk: every photo must be free-source (Unsplash licence) and credited.
- Machine-translated Indonesian shipped unreviewed without anyone knowing: Indonesian copy that I draft is
  listed so the client can review it.

## Constraints

- **Astro** (user's choice), static output.
- Design: Direction E. Palette from `cohesion logo and color pattern.png`; navy, teal, yellow, green; Montserrat
  headlines, Nunito Sans body; black-and-white photography under a navy gradient.
- Motion per mockup: hero photo slider crossfades, visitor-controlled, **no autoplay**; photo cards lift and
  zoom on hover. `prefers-reduced-motion`: opacity fades only.
- Photos: free-source only. Client will replace with foundation photos later, so images live in one folder and
  are referenced from data, not hard-coded in markup.
- Existing repo `/Users/ddt/Documents/cohesion` holds unrelated server runbooks. The site lives in `website/`.
  Nothing outside `website/` and `docs/` is touched. The two staged backup tarballs are not part of this work.
- Skills: build follows `superpowers` (this process) and `ui-ux-pro-max` (Astro stack guidance and pre-delivery
  UX checklist).

## Approaches considered

1. **Static Astro, built-in i18n routing, content in typed data files, plain CSS, tiny vanilla JS.** Chosen.
   Smallest, fastest, no runtime framework, matches "landing page". Cost: client edits content via a developer.
2. Astro with content collections (Markdown per person/update). More comfortable for non-developers editing
   bios, but ten-odd bilingual bios in Markdown plus frontmatter is more files than the data file approach.
   Easy to move to later because data shapes stay the same.
3. Astro plus a headless CMS. Client self-service, but adds hosting, accounts and cost the client has not
   asked for. Rejected for now.

The user named Astro and talked in outcomes, so approach 1 is my call; the user did not pick between 1 to 3.

## Decisions

### Site structure and routing

- English at `/`, Indonesian at `/id/` (Astro i18n, `prefixDefaultLocale: false`; mockup shows EN active).
  The ID | EN toggle links to the same page in the other language. `hreflang` and `<html lang>` set per page.
- Pages (each exists in both languages): `/`, `/about`, `/about/team`, `/about/team/[slug]`, `/our-work`,
  `/resources`, `/contact`, `/404`.
- Header: logo, Home, About Us, Our Work, Resources, Contact, ID | EN, yellow **Collaborate** button linking to
  `/contact`. The top green contact strip is removed (client: "Dihapus aja").
- Footer: logo, full office address (from the organization profile), email, phone, LinkedIn, Photos: Unsplash
  credit. The location line next to the logo on sub-pages is removed.
- A floating WhatsApp button, bottom-right on every page, opens `https://wa.me/628122281026` with the starter
  message, in the page's language.

### Client feedback, resolved

| # | Where | Client comment | Decision |
|---|---|---|---|
| 1 | Cover | Direction E chosen as template | Build Direction E. |
| 2 | All pages | Photos must be free-source | Unsplash only, downloaded into the repo, credited in footer. |
| 3 | Home top strip | "Dihapus aja" | Remove strip. LinkedIn link moves to footer and Contact. |
| 4 | Home hero | "Dibuat tanpa coretan" | Remove brush strokes from the Home hero. My call: also remove from all other page heroes for consistency. |
| 5 | Home, tiles under hero | Overlap with banner, too full | Remove the three image tiles. |
| 6 | Home, "Since 2026 / Depok" badge | "Hilangin aja" | Remove badge. |
| 7 | Home, eyebrow labels (ABOUT COHESION, UPDATES, etc.) | Font bigger | Eyebrow labels at least 14px, uppercase tracking kept. Same rule on every page. |
| 8 | Nav and other menu-like text | Font bigger | Nav 16-17px, body 17-18px, buttons 16px. |
| 9 | Vision and Mission | Same font size | Same size and weight. |
| 10 | Areas of work 04-06 | Order | 04 Education and Capacity Development, 05 Research and Development, 06 Monitoring, Evaluation and Learning. Same order everywhere (Home, Our Work, About divisions). |
| 11 | Home, "JOIN US" label | "Kalau collaborate, gmn?" | My call: label reads "Collaborate" and the band links to Contact. |
| 12 | Home, WhatsApp button | Add floating WA logo | Floating WhatsApp button on all pages. |
| 13 | Home footer location | Full address from profile | Footer shows the full address on every page. |
| 14 | About, stat cards | "What is the alternative?" Replies: wheat, rice, salt, environment, healthy plate, school bench | My call: replace the two stat cards with a tile of simple SVG illustrations from that list. Keep the notarial deed card. **Confirm with client.** |
| 15 | About, advisors | 8 names | Eight advisors from the profile document. Verdi Yusuf is dropped (user's decision). Text-only chips, no photo, not clickable. |
| 16 | About, divisions | Division names only, drop `Head [TBC]` | Names only, bilingual. |
| 17 | About, Lanny Yusnita and Tohom Sihombing | Not on the website | Removed. Their photos stay in the repo folder, unused. |
| 18 | About, Elvina profile at bottom | Autoscroll, then "clickable to a new page" | Every person with a bio links to their own profile page. No bottom profile block. |
| 19 | Resources footer | Remove Depok, Indonesia | Covered by footer rule above. Amir's "not on every page" comment applies to the top strip, badge and footer line. "Rooted in Depok" copy on About stays (it is factual HQ info). |
| 20 | Contact | Office, then Email, then LinkedIn; add WhatsApp; add Download Organization Profile button | Cards in that order plus a WhatsApp card; download button in the Contact hero, the Home About section and the footer. |
| 21 | Team structure | Like https://cisdi.org/tentang-cisdi/tim-cisdi | See Team page. |

### Team page (CISDI-style)

CISDI's page is grouped by governance body, with each group a heading and a row of photo cards, and each
card links to a separate profile page. COHESION uses the same pattern, in this order:

1. **Pembina / Board of Trustees:** Dr. Elvina Karyadi, MSc, PhD, SpGK (Chair), Rozy Afrial Jafar.
2. **Penasihat / Board of Advisors (8):** Ir. Adhi S. Lukman, Dr. Ir. Albertus Sulaiman SSi MSi,
   Donny Utoyo ST MSi, Ir. Doddy Izwardy MA PhD, Prof. dr. Fasli Jalal PhD, Franky Zamzani S.Hut M.Env.,
   Prof. dr. Muchtaruddin Mansyur MS SpOK PhD, Dr. Sunawang Rahardjo MSc. The final profile gives each
   advisor two credential lines (for example "Chair, PERSAGI / Former Director of Community Nutrition,
   Ministry of Health"); cards show initials avatar, name and those lines. No photo, no link until the client
   supplies photo and profile. Indonesian versions of the credential lines are drafted by me for review.
3. **Pengurus / Board of Management:** Eriana Asri (Chair), Amir Syarifudin (Co-chair),
   Nurkhayati Darunifah (Secretary), Intan Utoyo (Treasurer).
4. **Pengawas / Board of Supervisors:** Syaiful Anwar.

Card: photo, name, role. Profile page: photo, name, role, bio (language-matched), back link, optional
LinkedIn later. Bios and Indonesian text come from `~/Downloads/Profil Tim Cohesion_v2a.pdf` (English and
Indonesian side by side). Photos from `Foto Cohesion_Website/`. About Us links to the Team page; the mockup's
timeline structure is replaced by this.

### Content and data

- Strings in per-language dictionaries; people, divisions, updates and publications in typed data files.
- Updates ("Activities and stories"): two entries from the mockup (launch event, first board meeting with
  advisors), no invented dates, cards not clickable. **Confirm with client that these are real and what
  photo/date to use.**
- Resources: "No publications yet" state with Follow on LinkedIn; filter tabs render only when there is data.
- **Source of truth for site copy** is the final organization profile, `~/Downloads/COHESION Profile_final.pdf`
  (9 pages, from Eriana). Where it differs from the Direction E mockup, the profile wins: Values order
  (Integrity, Collaboration, Evidence, Sustainability, Inclusion, Empowerment), areas of work order,
  role titles (Chief, Member, Chair, Co-chair, Secretary, Treasurer, Supervisor), and the About text.
  The final About text no longer mentions the 28 October 2026 establishment date or Depok. The mockup's
  "Notarial Deed No. 09" card was not commented on, so it stays. **Confirm with client that it should stay.**
- Organization profile download: `COHESION Profile_final.pdf`, copied to `website/public/` and renamed
  `COHESION-Organization-Profile.pdf` (6 MB; compress if it can be done without visible loss). It is English
  only, so both language versions link to it. Ask the client whether an Indonesian version is coming.
- Contact map: embedded map for the office address, loaded lazily. Address:
  Ruko De Khirani No 3, Jl Bhakti ABRI, RT 04/RW 06, Kel. Sukamaju Baru, Kec. Tapos, Kota Depok,
  Jawa Barat 16455. Phone +62 8122 281026. Email info@cohesion-foundation.org.
- LinkedIn URL: not supplied anywhere. **Needed from client.** Until then the link is hidden, not dead.

### Quality bar

- WCAG 2.2 AA: 4.5:1 text contrast, visible focus, skip link, keyboard-operable slider, alt text, 44px touch targets.
- Responsive from 360px; no horizontal scroll.
- Images: WebP/AVIF through Astro's image pipeline, explicit sizes, lazy loading below the fold.
- SEO: titles, descriptions, Open Graph, `sitemap.xml`, `hreflang`. Absolute URLs use one config value,
  `site: https://cohesion-foundation.org` (my call, from the email domain; the profile PDF says `www.`, so confirm
  which host is canonical). All internal links go through one helper.
- One runnable check: a build-output script that fails if any English page has no Indonesian twin, any profile link is
  dead, or any page contains `[TBC]` or `placeholder` text. `astro check` and `astro build` must pass.
- Visual check: screenshots at 390, 768 and 1280px for every page, compared with the mockup and the comments table.

## Left to the builder

Exact breakpoints and spacing scale, component split, icon set, exact crop of the logo from the PNG, choice of
Unsplash photos (subject list: Indonesian communities, children, markets, rice fields, forest, schools),
slider implementation, the Indonesian translations of UI and marketing copy (bios are supplied), map embed
provider, how to extract the bilingual bios from the PDF columns.

## Open items for the client (do not block the build)

1. Confirm the stat-card replacement idea (row 14).
2. Real LinkedIn URL.
3. Is an Indonesian version of the organization profile PDF coming? Should the Notarial Deed card stay on About?
4. Real dates, photos and text for the two updates.
5. Review the Indonesian copy drafted for the site.
