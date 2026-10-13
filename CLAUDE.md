# Kremer & Lily — Wedding Site

**This repo holds two separate deliverables. Know which one you're editing.**

## 1. Main wedding website — `index.html` (+ `rsvp-details.html`)
The full site; its URL goes on the **formal invitation (early 2027)**. Live at **kremerandlily.com**. (Renamed from `lilyandkremer.com`, which now permanently 301-redirects here — see Deploy & verify. Contact email stays `lilyandkremer@gmail.com`.)

- **Design (per Lily's instruction docs, this session):** clean & traditional —
  **cream backgrounds, burgundy accents**, no stripes, single photos (no collage).
  Fonts: Cormorant Garamond (serif), Pinyon Script (names), Jost (sans).
- **Tabbed single-page app** — the top nav swaps sections in place, hash-routed; no
  long scroll. Tabs **in nav order**: **Home** (hero + single photo), **Our Story**
  (`#story`, paragraph + 5-photo row), **RSVP** (`#rsvp`), **Details** (`#details`,
  ceremony/reception), **Travel** (`#travel`, room block + logistics), **FAQ**
  (`#faq`), **Gallery** (`#gallery`, photo grid), **Registry** (`#registry`).
  The tab controller + tab CSS live near the bottom of `index.html`.
- **Public** — the password gate was removed. The site is `noindex` (won't show in search).
- **RSVP — Zola-style household lookup (this session):** the `#rsvp` tab is a multi-step
  wizard **in `index.html`** (find invitation by first+last name → respond per household
  member → authorized plus-one → dietary → review → submit → confirmation; returning
  guests pre-fill). It POSTs to a Google Apps Script (`apps-script/rsvp-household.gs`,
  setup: `apps-script/RSVP-SETUP.md`) that reads/writes the **master guest sheet**
  server-side — the guest list is never exposed to the browser. Endpoint URL goes in
  `rsvp-config.js` as `window.RSVP_LOOKUP_ENDPOINT` (empty → tab shows "opens soon").
  Master sheet: `FINAL Master Wedding Guest List`, id
  `1ZU6yw2LLRTBTWQQl40YOc82atR71RvLo6PnNPrx1MI0` (shared to chester@newatlantic.ai;
  ~136 guests / 75 households; Household ID groups a party; unnamed plus-ones are
  placeholder-name rows). The Apps Script auto-detects columns at runtime — run its
  `?action=diagnose` to confirm the mapping before relying on it. **Not yet deployed.**
  (The old single-form RSVP via `rsvp-details.html` + `Code.gs` is retired but kept in
  the repo for reference.)
- **Still pending from Lily** (placeholders in place, marked with HTML comments): final
  homepage photo, the Our Story paragraph + its 5 photos, Gallery photos, Registry link
  & wording. Dates/times/room-block/FAQ are final.
- **Developer Tools (self-serve editor for Lily)** — a hidden AI editor baked into
  the main site so Lily can change it herself, no code. **Hidden from guests**;
  unlock at `kremerandlily.com/#dev` with a password. A floating ✎ launcher sits on
  every tab and a "Developer Tools" nav item opens the full view. Phases:
  - **Phase 1 (built, this session):** an AI **chat** — Lily describes a change, it
    edits `index.html` and commits straight to `main` (live in
    ~1 min, her choice), labelled `Lily via chat: …`. Plus a toolbar **Undo** (reverts
    the last editor commit) and **Save version** → a named snapshot in a **version
    history** table (`versions/manifest.json`) she can **Restore** (the live site
    *becomes* that save; every save is kept). Redo is stubbed until Phase 2.
  - **Phase 2 (designed, not built):** direct manipulation — click/drag/resize
    elements, inline text editing, add/remove photos & blocks; staged locally with
    Undo/Redo, published on Save.
  - **Phase 3 (planned):** color-palette picker, global + per-selection fonts, photo
    upload from phone.
  - **Backend:** a Cloudflare Worker in `editor-worker/` (`worker.js`, `wrangler.toml`,
    `SETUP.md`) holds the secrets (Anthropic key + a fine-grained GitHub PAT +
    `EDIT_PASSWORD`) — the static site can't. The frontend talks only to it; its URL
    lives in `editor-config.js` (empty until deployed → tools show a "preview, not
    connected" notice). The Worker **refuses** any edit that would break the nav,
    tabs, RSVP card, or the editor (anchor checks in `worker.js`), and can only touch
    `index.html`. Model: Claude Sonnet, with prompt caching. **Not yet deployed** —
    needs Chester to create the two keys + deploy the Worker.

## 2. Save the Date — `savethedate/index.html`
Standalone **public** announcement (a photo-booth strip). **Mails ~September 2026**
(~a month out) — it's the first thing guests receive; the main site comes later, on the
invitation.

- **Being built in a separate session.** It is getting a **guest-list name-lookup +
  plus-one** RSVP: a guest types their name → it's matched against a guest-list Google
  Sheet → they RSVP for their whole party, with a +1 only if that party is approved.
  This lookup belongs on the Save the Date, **not** the main site.

## Anchor facts
- Couple: **Kremer** (pronounced "Kramer") & **Lily** (one L). Write their names in this order (Kremer first) wherever both appear.
- **September 18, 2027**, Lago Mar Beach Resort & Club, **Fort Lauderdale, FL**.
- Contact: lilyandkremer@gmail.com.

## Deploy & verify
- **Hosting:** GitHub Pages — repo `chestermantel/lily-wedding-123`, branch `main`,
  custom domain via `CNAME` = **kremerandlily.com**. DNS is on Cloudflare but
  **DNS-only (grey cloud)** for the live site, so GitHub serves the TLS cert and HTTPS
  is enforced (no Cloudflare SSL settings involved).
- **Old domain redirect:** `lilyandkremer.com` (original name, printed on the
  Save-the-Dates) is kept and **redirects to `kremerandlily.com`** (path-preserving),
  served by a **separate one-file repo** `chestermantel/lilyandkremer-redirect` on
  GitHub Pages — its `CNAME` claims `lilyandkremer.com` and its `index.html`/`404.html`
  bounce every path to `kremerandlily.com` client-side (fine for a noindex site). The old
  apex A/AAAA + `www` DNS stay **DNS-only (grey cloud)** pointing at GitHub Pages — don't
  proxy them. `fantasyflops.lilyandkremer.com` is a separate site, left untouched. (The
  scoped Cloudflare token can't bind Worker routes, so a CF-Worker 301 wasn't an option.)
- **Deploy = commit + push to `main`** (Pages rebuilds in ~30–60s).
  **Confirm the push with the user first** — they approve each one.
- **Cloudflare API access:** a scoped token lives at `~/.config/cloudflare/claude.token`
  (chmod 600) — lets Claude manage DNS/Pages/Workers directly via
  `curl -H "Authorization: Bearer $(cat ~/.config/cloudflare/claude.token)"`. Only use it on
  the user's request, never print the value. Zone ids: **kremerandlily.com** (primary)
  `a86e8b247bbb1aa37b79451b60919ea5`; **lilyandkremer.com** (redirect)
  `5ba99e4c19288c4f64b4b98d5d144c6c`. (Details in memory `cloudflare-api-token`.)
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
- `Kremer/` — brother-in-law's personal sandbox (untracked). `fantasy-flops.html` is deployed
  **separately** at **fantasyflops.lilyandkremer.com** — its own private repo
  `chestermantel/fantasy-flops` (GitHub Pages) + a Cloudflare `CNAME`, NOT part of this site.
  Keep it separate; stay off anything "New Atlantic."
