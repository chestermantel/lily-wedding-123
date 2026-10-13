# RSVP backend setup — click-by-click guide

This takes about 10 minutes and turns the wedding site's RSVP form into a real
system: every RSVP lands as a **row in a Google Sheet** *and* as an **email to
the wedding inbox**. No coding needed — just clicking and pasting.

## 1. Sign into the right Google account

Sign into Google as **lilyandkremer@gmail.com** before you start (recommended,
so Lily owns the spreadsheet and the data lives in the wedding account).

Any Google account works, though — the notification email always goes to
`lilyandkremer@gmail.com` regardless of which account runs the script.

## 2. Create the Google Sheet

1. Go to **[sheets.new](https://sheets.new)** — this instantly creates a blank spreadsheet.
2. Click "Untitled spreadsheet" at the top-left and name it something like
   **Kremer & Lily — RSVPs**.

That's it — the script will create the "RSVPs" tab and column headers by itself.

## 3. Add the script

1. In the spreadsheet's menu, click **Extensions → Apps Script**.
   A new tab opens with a code editor showing a few placeholder lines
   (`function myFunction() { ... }`).
2. **Delete everything** in that editor.
3. Open the file **`apps-script/Code.gs`** from this project, copy **all** of it,
   and paste it into the empty editor.
4. Click the **floppy-disk Save icon** (or press Cmd+S / Ctrl+S).
5. Optional: click "Untitled project" at the top and name it **RSVP**.

## 4. Deploy it as a web app

This is the step that gives the website a URL to send RSVPs to.

1. Click the blue **Deploy** button (top-right) → **New deployment**.
2. Click the **gear icon** next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `RSVP`
   - **Execute as:** **Me** (your email)
   - **Who has access:** **Anyone**  ← important! This is what lets the
     website (and your guests) reach it without logging in. "Anyone" here
     means anyone can *submit an RSVP* — nobody can see the sheet or the code.
4. Click **Deploy**.
5. Google now asks you to **authorize** the script (it needs permission to
   write to your sheet and send you email). Click **Authorize access**, pick
   your account, and then you'll hit a scary-looking screen:

   > **Google hasn't verified this app**

   This is normal and expected. Google shows it for *every* personal script
   that hasn't gone through their (commercial) app-review process — which
   yours hasn't, because you literally just wrote it. It's your own code
   running in your own account. To continue:

   1. Click **Advanced** (small link at the bottom-left).
   2. Click **Go to RSVP (unsafe)** — again, it's only "unsafe" in the sense
      that Google hasn't reviewed it; you have.
   3. Click **Allow**.

6. You'll now see a **Web app URL** that looks like:

   ```
   https://script.google.com/macros/s/AKfycb...LOTS-OF-LETTERS.../exec
   ```

   **Copy it** (there's a copy button). It must end in **`/exec`**.

## 5. Test it

Paste the URL into a normal browser tab and press Enter. You should see:

```json
{"status":"ok","service":"lily-kremer-rsvp"}
```

If you see that, the backend is live. (If you see a Google error page instead,
re-check step 4 — usually "Who has access" wasn't set to "Anyone".)

## 6. Connect the website

Open **`rsvp-config.js`** in the project root and paste the URL between the
quotes:

```js
window.RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycb.../exec";
```

Then commit and push — all three site options switch from the email fallback
to automatic background submission about a minute later.

*(Or just tell Claude the URL and it will wire it in and deploy for you.)*

## 7. What you get

- Every RSVP appears instantly as a **row in the Google Sheet** — with a
  timestamp, so you can count guests, tally meals, and track allergies.
- Every RSVP also arrives as an **email to lilyandkremer@gmail.com**, with
  the guest's address as the reply-to, so you can hit Reply to write back.
- The guest sees an **instant on-page thank-you** — no email app opens on
  their side, nothing to send. It just works.

## 8. If you edit the script later

Saving the code is **not** enough — the URL keeps running the old version
until you publish a new one:

**Deploy → Manage deployments → pencil icon (edit) → Version: "New version" → Deploy.**

The URL stays the same, so you never have to touch `rsvp-config.js` again.

## 9. Troubleshooting

| Symptom | Likely cause & fix |
|---|---|
| The form shows the error/fallback line instead of the thank-you | The URL in `rsvp-config.js` is wrong (must end in `/exec`), or the deployment's "Who has access" isn't set to **Anyone**. Re-check steps 4 and 6. |
| Rows appear in the sheet but no email arrives | Check the spam folder first. Also: Google caps MailApp at roughly **100 emails/day** for a personal account — far more than any wedding needs, but a burst of testing could briefly hit it. |
| The "RSVPs" tab has a duplicate header row | Harmless — it can happen if the tab was renamed or cleared at just the wrong moment. Delete the extra row and carry on. |
| Browser test shows a Google sign-in page | "Who has access" is set to "Only myself" or your domain. Redeploy with **Anyone** (step 4). |
