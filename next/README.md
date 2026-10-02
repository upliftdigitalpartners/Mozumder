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

## Media

`media/fleet/` holds the fleet card videos: a seamless-loop MP4 (H.264) and
WebM (VP9) per vehicle at 960px, plus a JPG still. They were made from the
raw AI renders on the `media-raw` branch (the last 0.8s of each clip is
cross-faded into the first so it loops without a jump). `js/fleet-motion.js`
attaches them to the cards; the animated line drawings stay as the fallback.

`media/home/` holds the homepage footage, made from the `reference` renders on
`media-raw`:

- `hero`, `port`, `road`, `hub` — seamless-loop MP4s in two sizes (`-lg`
  1280px for desktop, `-sm` 720px for phones) plus a JPG poster each.
- `seq/sea`, `seq/handoff`, `seq/rise` — 72-frame WebP sequences (`lg`/`sm`)
  that scrub with the scroll position.

## Homepage

`index.html` is a scroll-driven film. `js/home/home.js` keeps a fixed stage of
media layers behind the chapter sections and crossfades them as you scroll;
`js/home/network-map.js` is the Three.js map of Bangladesh that takes over at
the end of the drone rise. Three.js r186 is vendored in `vendor/three/`.
