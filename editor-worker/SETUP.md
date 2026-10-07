# Developer Tools backend — setup (one time)

This Cloudflare Worker is the brain behind the **Developer Tools** on the
wedding site: it holds the secrets, runs the AI edits, and commits them to
GitHub. The website never sees the keys — it only talks to this Worker.

You need three things, then one deploy. ~15 minutes.

---

## 1. An Anthropic API key
<https://console.anthropic.com> → **API keys** → *Create key*. Copy it
(starts `sk-ant-...`). This is the key Lily's edits will bill against — put a
small monthly spend cap on it in the console (Billing → Limits) so there are no
surprises.

## 2. A GitHub token (fine-grained, this repo only)
<https://github.com/settings/tokens?type=beta> → **Generate new token**
- **Repository access** → *Only select repositories* → `chestermantel/lily-wedding-123`
- **Permissions** → *Repository permissions* → **Contents: Read and write**
  (that's the only one needed)
- Generate, copy the token (starts `github_pat_...`).

## 3. The editor password
Whatever Lily will type to unlock Developer Tools (e.g. `8463`, or something
longer — it's the only thing standing between the public internet and your API
key, so a few random words is better than 4 digits).

---

## Deploy

From this folder:

```bash
cd "editor-worker"
npx wrangler login          # once, opens the browser
npx wrangler secret put ANTHROPIC_API_KEY   # paste key from step 1
npx wrangler secret put GITHUB_TOKEN        # paste token from step 2
npx wrangler secret put EDIT_PASSWORD       # type password from step 3
npx wrangler deploy
```

The last command prints a URL like
`https://lk-editor.<your-subdomain>.workers.dev`.

## Connect the website to it
Paste that URL into **`editor-config.js`** (repo root):

```js
window.EDIT_ENDPOINT = "https://lk-editor.<your-subdomain>.workers.dev";
```

Commit + push. Done — visit `https://lilyandkremer.com/#dev`, enter the
password, and the Developer Tools unlock.

---

## Notes
- **Who can use it:** only someone with the password. Guests never see the tools
  (they're hidden until unlocked). Keep the password off the public site.
- **What it can touch:** only `index.html` and `rsvp-details.html`. It cannot
  edit `CNAME`, the Worker, the RSVP backend, or anything else — and it refuses
  any change that would break the nav, tabs, RSVP form, or the editor itself.
- **Every edit is a git commit** labelled `Lily via chat: …` / `Save version: …`
  / `Restore version: …`, so you can always see what changed and `git revert` it.
- **Cost:** edits run on Claude Sonnet with prompt caching; typical edit is a few
  cents. The `DAILY_LIMIT` (default 100/day) only applies if you add the optional
  KV namespace (see `wrangler.toml`); otherwise the Anthropic spend cap is your
  backstop.
- **Rotate/revoke:** delete the GitHub token or Anthropic key to instantly cut
  off access; re-run `wrangler secret put` to change the password.
