# Lily & Kremer — Wedding Site

**This repo holds two separate deliverables. Know which one you're editing.**

## 1. Main wedding website — `index.html` (+ `rsvp-details.html`)
The full site; its URL goes on the **formal invitation (early 2027)**. Live at **lilyandkremer.com**.

- **Tabbed single-page app** — the top nav swaps sections in place, hash-routed
  (`#home`, `#schedule`, `#travel`, `#faq`, `#rsvp`); there is no long scroll. Tabs:
  **Home** (hero + all the photos), **Schedule**, **Travel**, **FAQ**, **RSVP**.
  The tab controller + tab CSS live near the bottom of `index.html`.
- **Public** — the password gate was removed. The site is `noindex` (won't show in search).
- **RSVP:** the `#rsvp` tab (name + attending) hands off to `rsvp-details.html`, which
  POSTs to a Google Apps Script that appends a row to the RSVP sheet **and** emails
  lilyandkremer@gmail.com. The endpoint URL is in `rsvp-config.js`; backend code is
  `apps-script/Code.gs` (walkthrough: `apps-script/SETUP.md`). Editing the script
  requires a redeploy ("Manage deployments → new version") in Apps Script.

## 2. Save the Date — `savethedate/index.html`
Standalone **public** announcement (a photo-booth strip). **Mails ~September 2026**
(~a month out) — it's the first thing guests receive; the main site comes later, on the
invitation.

- **Being built in a separate session.** It is getting a **guest-list name-lookup +
  plus-one** RSVP: a guest types their name → it's matched against a guest-list Google
  Sheet → they RSVP for their whole party, with a +1 only if that party is approved.
  This lookup belongs on the Save the Date, **not** the main site.

## Anchor facts
- Couple: **Lily** (one L) & **Kremer** (pronounced "Kramer").
- **September 18, 2027**, Lago Mar Beach Resort & Club, **Fort Lauderdale, FL**.
- Contact: lilyandkremer@gmail.com.

## Deploy & verify
- **Hosting:** GitHub Pages — repo `chestermantel/lily-wedding-123`, branch `main`,
  custom domain via `CNAME`. DNS is on Cloudflare but **DNS-only (grey cloud)**, so
  GitHub serves the TLS cert and HTTPS is enforced (no Cloudflare SSL settings involved).
- **Deploy = commit + push to `main`** (Pages rebuilds in ~30–60s).
  **Confirm the push with the user first** — they approve each one.
- **Verify with headless Chrome, not the in-app browser pane** (its screenshots and
  scrolling misbehave in this environment):
  ```
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
    --disable-gpu --hide-scrollbars --window-size=1280,900 --virtual-time-budget=2600 \
    --screenshot=out.png "file:///<repo>/index.html?nc#faq"
  ```
  `?nc` skips the bouquet intro cover; `#<tab>` opens a specific tab.

## Also in the repo
- `flowers/` — transparent-PNG flower cut-outs (from Lily). `photos/` — couple photos.
- `peepeepoopoo/` — hidden joke site; reached via the faint **❦** centered in the header. Keep it.
- `pinball/` — untracked, not created in these sessions. Read it before touching or publishing.
