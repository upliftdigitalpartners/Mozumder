# Mozumder — Website

A modern, handcrafted static website for **Mozumder** — a diversified logistics and transportation enterprise based in Chattogram, Bangladesh.

> "Streamlined Logistics, Accelerated Growth."

## Stack

- **Zero-dependency static site** — just HTML, CSS and vanilla JavaScript.
- No build step. No framework. No tooling required to work or deploy.
- Works immediately on **GitHub Pages (free)** and **Render Static Sites (free)**.

## Structure

```
.
├── index.html              # Home — scroll-driven film + 3D network map
├── about.html, services.html, fleet.html, sister-concerns.html,
│   partners.html, contact.html
├── 404.html
├── css/                    # main.css (design system), enhance*.css,
│                           # home.css (homepage film), pages.css (photo
│                           # headers), fleet-motion.css (fleet cards)
├── js/                     # main.js, enhance*.js (incl. EN/বাং toggle),
│                           # i18n-bn.js (Bangla text), home/ (film + map),
│                           # fleet-motion.js, pages.js, alerts.js, places.js
├── media/                  # compressed web footage (home/, pages/, fleet/)
├── vendor/three/           # Three.js r186 (for the 3D map)
├── tools/i18n_annotate.py  # keeps the Bangla toggle in sync with page text
├── data/alerts.json        # operational notices strip
├── assets/                 # logo, favicon, icons, partner logos
├── old/                    # previous site design, kept as a backup (noindex)
├── next/                   # redirects from the old /next/ test links
├── robots.txt, sitemap.xml, CNAME, render.yaml, .nojekyll
└── .github/workflows/deploy.yml   # GH Pages auto-deploy
```

The raw AI footage the media was made from lives on the `media-raw` branch.

## Local preview

Pick any simple HTTP server (fonts and images load best when served):

```bash
# Python 3
python3 -m http.server 8080

# Or, Node (no install needed if you have npx)
npx --yes serve@latest .
```

Then open <http://localhost:8080>.

## Deploy to GitHub Pages (free)

1. Create a GitHub repo (e.g. `mozumder-site`) and push this directory.
2. In your repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow in `.github/workflows/deploy.yml` runs on every push to `main` and deploys.
4. Your site goes live at `https://<username>.github.io/<repo>/`.

If you own a domain (e.g. `mozumderbd.net`):

- Add a `CNAME` file at the repo root containing `www.mozumderbd.net`.
- Configure DNS with an `A` record to GitHub Pages and a `CNAME` for `www`.

## Deploy to Render (free)

1. Push to GitHub.
2. Sign in to <https://render.com> and click **New → Static Site**.
3. Pick the repo. Render auto-detects `render.yaml` and deploys.
4. Build command: *(empty)*. Publish directory: `./`.

## Customizing

### Colors & type
All brand tokens live at the top of `css/main.css`:

```css
:root {
  --ink: #0a1f4d;      /* primary navy */
  --gold: #f4a83c;     /* accent */
  /* ... */
}
```

### Swapping partner logos
`partners.html` uses typographic tiles by default. Replace each tile with an
`<img src="assets/partners/brand.svg">` once you have brand-approved logos.

### Replacing hero / fleet imagery
The site currently uses Unsplash CDN URLs (free to hotlink under Unsplash
License). Swap with your own photography by editing the `<img src="...">` or
`background-image: url(...)` references, or drop images into `assets/img/` and
update the paths.

### Contact form
`contact.html` posts to a `mailto:` link via `js/main.js`. To wire a real
backend (no server needed), use a free service like:

- **Formspree** — change the form `action="https://formspree.io/f/xxx"` and
  remove the JS intercept in `main.js`.
- **Getform / Web3Forms / Basin** — similar pattern.

## Content sources

Content copy was adapted from the Mozumder profile (2025) including:

- About Us / Welcome / Mission & Vision
- Six sister concerns
- Eight core services
- Nine product-line units
- Corporate partner shortlist

## License

Mozumder content and branding are property of Mozumder.
The website template code may be modified freely for the company&rsquo;s
own use.

## Media

`media/fleet/` holds the fleet card videos: a seamless-loop MP4 (H.264) and
WebM (VP9) per vehicle at 960px, plus a JPG still. They were made from the
raw AI renders on the `media-raw` branch (the last 0.8s of each clip is
cross-faded into the first so it loops without a jump). `js/fleet-motion.js`
attaches them to the cards; the animated line drawings stay as the fallback.

`media/home/` holds the homepage footage, made from the `reference` renders on
`media-raw`:

- `hero`, `port`, `road`, `hub` — seamless-loop MP4s: `-lg` (1280px
  landscape) and, except `hub`, `-pt` (608×1080 portrait cut at the source's
  full resolution, centred on the subject) for phones held upright, plus a
  JPG poster each.
- `seq/sea`, `seq/handoff`, `seq/rise` — 72-frame WebP sequences (`lg`
  landscape / `pt` portrait) that scrub with the scroll position.

## Homepage

`index.html` is a scroll-driven film. `js/home/home.js` keeps a fixed stage of
media layers behind the chapter sections and crossfades them as you scroll;
`js/home/network-map.js` is the Three.js map of Bangladesh that takes over at
the end of the drone rise. Three.js r186 is vendored in `vendor/three/`.

## Bangla (EN / বাং toggle)

Every visible text block on these pages carries `data-i18n-auto="<key>"`,
where the key is a hash of its English HTML. `js/i18n-bn.js` maps keys to
Bangla HTML; `js/enhance-v2.js` swaps them in on বাং and restores the
original English on EN. (Short UI strings — nav, hero, quote form — still use
the older `data-i18n` dictionary inside `enhance-v2.js`.)

After editing English text on a page:

    python3 tools/i18n_annotate.py --write

It re-keys changed blocks, rewrites `tools/i18n-en.json` (key → English) and
reports how many keys lack Bangla. Add those to `js/i18n-bn.js`; until then
the changed block simply shows in English. Client brand names on the
Partners page are intentionally left in English.
