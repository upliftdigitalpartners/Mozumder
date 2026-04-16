# Mozumder Company — Website

A modern, handcrafted static website for **Mozumder Company** — a diversified logistics and transportation enterprise based in Chattogram, Bangladesh.

> "Streamlined Logistics, Accelerated Growth."

## Stack

- **Zero-dependency static site** — just HTML, CSS and vanilla JavaScript.
- No build step. No framework. No tooling required to work or deploy.
- Works immediately on **GitHub Pages (free)** and **Render Static Sites (free)**.

## Structure

```
.
├── index.html              # Home
├── about.html              # About + Welcome + Mission & Vision
├── services.html           # What we offer
├── fleet.html              # Product line / fleet
├── sister-concerns.html    # Six sister concerns
├── partners.html           # Corporate partners
├── contact.html            # Offices + enquiry form
├── 404.html
├── css/main.css            # Design system + all components
├── js/main.js              # Nav, reveal animations, count-up, form
├── assets/                 # logo, favicon, icons, partners
├── robots.txt
├── sitemap.xml
├── render.yaml             # Render deploy config (free)
├── .nojekyll               # GH Pages: serve files as-is
└── .github/workflows/deploy.yml   # GH Pages auto-deploy
```

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

Content copy was adapted from the Mozumder Company profile (2025) including:

- About Us / Welcome / Mission & Vision
- Six sister concerns
- Eight core services
- Nine product-line units
- Corporate partner shortlist

## License

Mozumder Company content and branding are property of Mozumder Company.
The website template code may be modified freely for the company&rsquo;s
own use.
