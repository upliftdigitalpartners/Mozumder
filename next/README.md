# /next — UI test environment

A sandbox copy of the site for building and testing a new UI without touching
the live pages at the repo root.

- Served at `https://www.mozumderbd.net/next/` (locally: `http://localhost:8080/next/`).
- Every page has `noindex, nofollow`, and `robots.txt` disallows `/next/`, so
  search engines stay on the live site.
- `css/` and `js/` here are **independent copies**: edit them freely.
- Images come from the shared `../assets/` folder, and notices from the shared
  `../data/alerts.json`. Put any new-UI-only images in `next/assets/`.
- Links between pages stay inside `/next/`.

## Promoting the new UI to live

When it's approved, copy the `next/` HTML, `css/` and `js/` over the root
files. Change `../assets/` back to `assets/`, change `../data/alerts.json`
back to `data/alerts.json`, and remove the `robots` noindex meta tag. Then
delete `next/` and the `Disallow: /next/` line in `robots.txt`.
