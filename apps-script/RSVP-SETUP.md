# RSVP (household lookup) — setup

This is the Zola-style RSVP: guests type their name, the site finds their
invitation, and they respond for their whole household. It reads and writes the
**master guest sheet** (`FINAL Master Wedding Guest List`) server-side via a
Google Apps Script Web App, so the guest list is never exposed in the browser.

Backend code: `apps-script/rsvp-household.gs`. ~15 minutes.

---

## 1. Create the Web App
1. Open the master sheet → **Extensions ▸ Apps Script**.
2. Delete the starter `Code.gs` content and paste in all of
   `apps-script/rsvp-household.gs`.
3. At the top, in `CONFIG`, change **`SETUP_KEY`** to a private string (it gates
   the diagnose/setup admin URLs). `SHEET_ID` is already set to this sheet; leave
   `SHEET_NAME` blank to auto-find the guest-list tab.
4. **Deploy ▸ New deployment ▸ Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Deploy, authorize, and copy the **Web app URL** (ends in `/exec`).

> Editing the script later needs **Deploy ▸ Manage deployments ▸ (edit) ▸
> New version** to take effect.

## 2. Verify the column mapping (important)
The script auto-detects columns by header name. Before trusting it, open in a
browser (replace `KEY` with your `SETUP_KEY`):

```
<YOUR /exec URL>?action=diagnose&key=KEY
```

It returns the detected worksheet, the header row, and which header each logical
field mapped to — plus one **sample household** (names shown only as initials)
with its members and any detected **plus-one slots**. Check that:
- `firstName`, `lastName`, `householdId`, `rsvp`, `dietary` mapped to the right
  columns (not `null`).
- The sample's **plus-one slots** are the unnamed/placeholder rows (and real
  people are listed as **members**, not slots).

If something's off, adjust `CONFIG` / the `SYNONYMS` lists (or the
`isPlusOneRow_` rule) at the top of the script, save, and redeploy a new version.

## 3. Add permanent Guest IDs (once)
```
<YOUR /exec URL>?action=setup&key=KEY
```
This adds a **Guest ID** column if missing and fills blanks with `G0001…`,
without touching Household IDs or any other data. The RSVP then uses Guest IDs as
the stable key for saving responses.

## 4. Connect the website
Paste the `/exec` URL into **`rsvp-config.js`**:

```js
window.RSVP_LOOKUP_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
```
Commit + push. The `#rsvp` tab switches from "opens soon" to the live flow.

## 5. Test
On the site's RSVP tab, search a known guest (try a couple, a family, someone
with a plus-one, and a name that isn't on the list). Confirm responses land on
the right rows in the sheet, no duplicate rows are created, and re-searching a
guest shows **Welcome back** with their saved answers.

---

## What it does / guarantees
- **Find by first + last name** (case/space/punctuation-tolerant); reveals a
  household only on a confident match. No autocomplete, no guest-list browsing.
- Returns **only** the matched household's RSVP fields — never the whole sheet,
  addresses, notes, or the sheet URL.
- Responds **per person**; a plus-one option appears **only** for households with
  a reserved (placeholder) plus-one row; naming a plus-one fills that reserved
  row — it never adds capacity or new rows.
- **Dietary needs** (free text) for attending guests; **no meal selection** in the
  guest form (the Meal Choice column is preserved, untouched).
- Writes `RSVP` (Attending / Declined / Pending), `Dietary Needs`, and an
  `RSVP Updated` timestamp to the existing rows. Returning guests update the same
  rows — no duplicates. The dashboard formulas keep working.
- Enforces household scope on every write (a guest can only change their own
  household). Honeypot field blocks basic bots.

## Notes
- **CORS:** the site posts with `content-type: text/plain` on purpose — that makes
  it a "simple" request so Apps Script (which can't answer CORS preflights) still
  returns a readable JSON response.
- This does **not** modify the Dashboard, Households & Mailing, Seating, or
  Additional Guests worksheets, or any column other than the RSVP ones above
  (plus the one-time Guest ID column from step 3).
