// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  site: 'https://cohesion-foundation.org', // keep in sync with src/config.ts
  trailingSlash: 'always',
  build: { format: 'directory' },
  // the team now lives on the About page
  redirects: { '/about/team': '/about/', '/id/about/team': '/id/about/' },
  i18n: {
    locales: ['en', 'id'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    {
      // static hosts look for /404.html; Astro writes /404/index.html
      name: 'copy-404',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          await copyFile(fileURLToPath(new URL('404/index.html', dir)), fileURLToPath(new URL('404.html', dir)));
        },
      },
    },
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', id: 'id' } } }),
  ],
});
