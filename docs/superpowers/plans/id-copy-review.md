# Indonesian copy to review with the client

Supplied by the client (not drafted by Claude): the biographies and role titles in `website/src/data/people.ts` (from `Profil Tim Cohesion_v2a.pdf`).

Drafted by Claude from the English text, for the client to review and correct:

| File | What |
|---|---|
| `website/src/i18n/id.ts` | all navigation, footer, page headings, descriptions and button text; the six values; slider text; About, Our Work, Resources, Contact copy; 404 |
| `website/src/data/advisors.ts` | the two credential lines for each of the eight advisors |
| `website/src/data/areas.ts` | names and one-line descriptions of the six areas of work (the names match the division names in the mockup) |
| `website/src/data/updates.ts` | titles, summaries and tags of the two updates |
| `website/src/data/photos.ts` | Indonesian alt text of every stock photo |
| `website/src/config.ts` | the starter WhatsApp message in Indonesian |

To change a sentence, edit it in the file and run `npm run build`.
