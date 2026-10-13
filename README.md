# Lily & Kremer — Wedding Website (three options)

Three candidate designs for the wedding website, all with the same content so you can
compare purely on vibe. The root page (`index.html`) is a chooser that links to all three.

| Folder | Concept | Vibe |
|--------|---------|------|
| `one/` | Garden Romantic | cute, airy, warm — arches & botanicals |
| `two/` | Fun & Funky | bold color blocks, chunky type, marquee |
| `three/` | Modern Editorial | refined magazine minimalism |

Each option is a single self-contained `index.html` — all styles and scripts inline,
only Google Fonts loaded externally. To edit anything, open the file and change the text.

## ⚠️ Things Lily should verify before sharing the link

- **The email address.** Every contact/RSVP link points to `lilyandkremer@gmail.com` —
  in the car you weren't sure if it's that or `kramerandlily@...`. If it's different,
  find-and-replace in all four HTML files.
- **Our Story copy** — it's a draft written from your description ("friends for so long…").
  Rewrite in your own voice whenever you're ready.
- **Wedding party list** — currently Lucie (Maid of Honor), Kent (Best Man), Alex (Best
  Man), Chester (Brother of the Bride). Easy to trim or remove the whole section.
- **Meal options** — Beef / Fish / Vegetarian are placeholders until the menu is real.
- **Photos** — there are styled placeholder frames; swap in real photos when you have them.

## How RSVP works

The form submits in the background (a POST to a small Google Apps Script) — each
RSVP becomes a **row in a Google Sheet** plus a **notification email** to the wedding
inbox, and the guest sees an instant on-page thank-you. Until the script's URL is
pasted into `rsvp-config.js`, the form falls back to composing a pre-filled email
addressed to the wedding inbox instead, so no RSVP is ever lost either way.

Setting up the backend takes ~10 minutes of clicking, no coding — follow
**[apps-script/SETUP.md](apps-script/SETUP.md)**.

## Local preview

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173 — or just double-click any `index.html`.

## Publishing

Hosted via GitHub Pages from the `main` branch of this repo. Push to `main` and the
site updates in about a minute.

### Custom domain: kremerandlily.com

The `CNAME` file in the repo root tells GitHub Pages to serve the site at
**kremerandlily.com**. The domain is registered at Cloudflare, so the DNS records
below must be added in the Cloudflare dashboard (DNS → Records) for the domain to
resolve. Set each record's proxy status to **DNS only** (grey cloud), not proxied —
GitHub Pages issues its own HTTPS certificate and Cloudflare's orange-cloud proxy
interferes with that.

| Type  | Name  | Value                   | Proxy    |
|-------|-------|-------------------------|----------|
| A     | `@`   | `185.199.108.153`       | DNS only |
| A     | `@`   | `185.199.109.153`       | DNS only |
| A     | `@`   | `185.199.110.153`       | DNS only |
| A     | `@`   | `185.199.111.153`       | DNS only |
| AAAA  | `@`   | `2606:50c0:8000::153`   | DNS only |
| AAAA  | `@`   | `2606:50c0:8001::153`   | DNS only |
| AAAA  | `@`   | `2606:50c0:8002::153`   | DNS only |
| AAAA  | `@`   | `2606:50c0:8003::153`   | DNS only |
| CNAME | `www` | `chestermantel.github.io` | DNS only |

After the records propagate (minutes to a couple of hours), GitHub provisions a TLS
certificate automatically and the site is live at `https://kremerandlily.com`. The
`www.kremerandlily.com` CNAME lets that variant redirect to the apex too.

**Old domain:** `lilyandkremer.com` (the site's original name, printed on the
Save-the-Dates) is kept and **permanently 301-redirects to `kremerandlily.com`**,
path-preserving, via a small Cloudflare Worker (`redirect-worker`) on routes
`lilyandkremer.com/*` and `www.lilyandkremer.com/*`. Its apex/www DNS is proxied
(orange) so the Worker can run; `fantasyflops.lilyandkremer.com` stays DNS-only and
is unaffected. Email at `lilyandkremer@gmail.com` is unchanged.
