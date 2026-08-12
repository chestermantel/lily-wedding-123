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

## How RSVP works right now

GitHub Pages is static hosting — it can't store form submissions. The RSVP form
composes a pre-filled email (name, attending, guest count, meal, allergies, note) and
opens it addressed to the wedding inbox. Every RSVP arrives as an email you can log.

**To upgrade to real tracking later** (recommended before invitations go out):
1. Create a Google Form with the same fields → responses land in a Google Sheet
   (guest count, meals, and allergies all tallied automatically), or use a service
   like Formspree/Tally.
2. Replace the `<form>` handler in the chosen option with the form's link or embed.

The same approach works for the "pre-RSVP" with electronic save-the-dates: duplicate
the form with just name + likely attending, and link it from the save-the-date email.

## Local preview

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173 — or just double-click any `index.html`.

## Publishing

Hosted via GitHub Pages from the `main` branch of this repo. Push to `main` and the
site updates in about a minute.
