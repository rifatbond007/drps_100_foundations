# Public assets

This directory contains static assets served from `/`.

- `images/` — uploaded/imported images (gitignored except for `.gitkeep`)
- `favicon.ico` — **TODO**: add a real 32×32 favicon (currently Next will 404 on favicon requests)

To add a favicon:

1. Place a 32×32 `.ico` file at `./favicon.ico`
2. Update `<link rel="icon">` in `src/app/layout.tsx` if you want a different path

Recommended sources for an open-license favicon:

- https://favicon.io/
- https://realfavicongenerator.net/
