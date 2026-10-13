/**
 * Kremer & Lily — Wedding RSVP backend
 * ------------------------------------
 * This script lives INSIDE a Google Sheet (Extensions → Apps Script).
 * When the wedding website submits an RSVP, this script:
 *   1. Adds a row to the "RSVPs" tab of the spreadsheet, and
 *   2. Emails a notification to the wedding inbox below.
 *
 * You should not need to edit anything except (maybe) NOTIFY_EMAIL.
 * If you DO edit this file later, remember: Deploy → Manage deployments →
 * pencil icon → "New version", or the website keeps running the old code.
 */

// Where notification emails go. Change this if the wedding inbox changes.
var NOTIFY_EMAIL = 'lilyandkremer@gmail.com';

// The name of the tab (bottom of the spreadsheet) where RSVPs are stored.
var SHEET_NAME = 'RSVPs';

/**
 * Runs every time the website submits an RSVP (an HTTP POST request).
 * The website sends the form fields; we save them and send the email.
 */
function doPost(e) {
  // Read the submitted fields. If a field wasn't sent, use ''.
  var p = (e && e.parameter) ? e.parameter : {};
  var name     = str(p.name);
  var email    = str(p.email);
  var attending = str(p.attending);
  var guests   = str(p.guests);
  var meal     = str(p.meal);
  var dietary  = str(p.dietary);
  var note     = str(p.note);
  var website  = str(p.website); // honeypot — see below

  // SPAM TRAP ("honeypot"): the form has an invisible field called "website"
  // that real guests never see or fill in. Spam robots fill in everything,
  // so if it has a value we quietly pretend success and save nothing.
  if (website !== '') {
    return jsonResponse({ result: 'success' });
  }

  try {
    // ---- 1. Save a row in the spreadsheet ----
    var sheet = getOrCreateSheet();

    // Store the guest count as a number when possible (nicer for counting).
    var guestsValue = guests;
    if (guests !== '' && !isNaN(Number(guests))) {
      guestsValue = Number(guests);
    }
    // Someone who declines brings nobody, so the Guests column stays summable:
    // put =SUM() under it and you get your real headcount.
    if (/decline|regret/i.test(attending)) {
      guestsValue = 0;
    }

    sheet.appendRow([
      new Date(),   // Timestamp
      name,
      email,
      attending,
      guestsValue,
      meal,
      dietary,
      note
    ]);

    // ---- 2. Send the notification email ----
    var subject = 'RSVP — ' + (name || 'No name given') + ' (' + (attending || '?') + ')';

    var body =
      'A new RSVP just arrived on the wedding website!\n' +
      '\n' +
      'Name:      ' + (name || '—') + '\n' +
      'Email:     ' + (email || '—') + '\n' +
      'Attending: ' + (attending || '—') + '\n' +
      'Guests:    ' + (guests || '—') + '\n' +
      'Meal:      ' + (meal || '—') + '\n' +
      'Dietary:   ' + (dietary || '—') + '\n' +
      'Note:      ' + (note || '—') + '\n' +
      '\n' +
      'This RSVP was also saved as a row in the Google Sheet.';

    var mailOptions = {};
    // If the guest gave a plausible email address, set it as the reply-to,
    // so hitting "Reply" on the notification writes straight back to them.
    if (looksLikeEmail(email)) {
      mailOptions.replyTo = email;
    }

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body, mailOptions);

    // Tell the website everything worked.
    return jsonResponse({ result: 'success' });

  } catch (err) {
    // Something went wrong (very rare). Tell the website so it can fall
    // back to the email method instead of losing the RSVP.
    return jsonResponse({
      result: 'error',
      message: (err && err.message) ? err.message : String(err)
    });
  }
}

/**
 * Runs when someone opens the Web app URL in a normal browser (a GET
 * request). Handy for testing: you should see {"status":"ok",...}.
 */
function doGet() {
  return jsonResponse({ status: 'ok', service: 'lily-kremer-rsvp' });
}

/* ----------------------- small helper functions ----------------------- */

/**
 * Finds the "RSVPs" tab in this spreadsheet, creating it if needed,
 * and writes the header row if the sheet is brand new / empty.
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // If row 1 is empty, write the column headers.
  var firstCell = sheet.getRange(1, 1).getValue();
  if (firstCell === '' || firstCell === null) {
    sheet.getRange(1, 1, 1, 8).setValues([[
      'Timestamp', 'Name', 'Email', 'Attending', 'Guests', 'Meal', 'Dietary', 'Note'
    ]]);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }

  return sheet;
}

/**
 * Turns any value into a trimmed string ('' if missing).
 */
function str(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).replace(/^\s+|\s+$/g, '');
}

/**
 * A very light check that a string looks like an email address —
 * just enough to safely use it as a reply-to.
 */
function looksLikeEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Sends a JSON reply back to the website.
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
