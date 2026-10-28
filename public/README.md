# Public assets

This directory contains static assets served from `/`.

- `images/` — site images: `hero/`, `landing/`, `people/`, `partners/` (each folder has a README with sources and what to replace), plus `logo.png`
- Favicon and app icons live in `src/app/` (`favicon.ico`, `icon.png`, `apple-icon.png`), generated from `images/logo.png`. Next.js adds the `<link rel="icon">` tags automatically; regenerate the three files if the logo changes.
