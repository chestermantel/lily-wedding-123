/* ============================================================================
 * Lily & Kremer — Zola-style household RSVP backend (Google Apps Script)
 * ----------------------------------------------------------------------------
 * Bind/point this at the master guest sheet and deploy as a Web App
 * ("Execute as: Me", "Who has access: Anyone"). The website's #rsvp tab POSTs
 * here; the guest list is NEVER exposed to the browser — lookups and writes
 * happen here, server-side, and only the matched household's fields are
 * returned. See apps-script/RSVP-SETUP.md for the click-by-click guide.
 *
 * Actions (POST JSON, content-type text/plain to avoid a CORS preflight):
 *   { action:"lookup", first, last }                 -> household + members
 *   { action:"submit", householdId, responses[], plusOnes[] } -> writes back
 * Admin (GET, gated by SETUP_KEY):
 *   ?action=diagnose&key=...   -> detected column mapping + a redacted sample
 *   ?action=setup&key=...      -> add/fill a permanent "Guest ID" column
 *
 * IMPORTANT: this auto-detects columns by header name. Run ?action=diagnose
 * once and confirm the mapping + plus-one detection look right for the real
 * sheet before relying on it. Nothing is overwritten except RSVP-related cells.
 * ==========================================================================*/

var CONFIG = {
  SHEET_ID: "1ZU6yw2LLRTBTWQQl40YOc82atR71RvLo6PnNPrx1MI0", // FINAL Master Wedding Guest List
  SHEET_NAME: "",            // leave "" to auto-find the guest-list worksheet
  SETUP_KEY: "lkwedding2027", // change me; gates diagnose/setup
  HONEYPOT: "website",
  // Treat these RSVP cell values as a response already given:
  RESPONDED: ["attending", "declined"],
};

// Logical field -> candidate header names (normalized, longest/most-specific first).
var SYNONYMS = {
  guestId:        ["guest id", "guestid", "guest #", "guest no", "guest number"],
  householdId:    ["household id", "householdid", "household #", "hh id", "house id"],
  firstName:      ["first name", "firstname", "given name", "first", "given"],
  lastName:       ["last name", "lastname", "surname", "family name", "last", "family"],
  adultChild:     ["adult/child", "adult / child", "adult or child", "age group", "adult", "child"],
  plusOne:        ["plus-one status", "plus one status", "plus-one", "plus one", "plusone", "+1", "plus 1"],
  rsvp:           ["rsvp status", "rsvp", "attending", "attendance"],
  rsvpUpdated:    ["rsvp updated", "rsvp update", "rsvp timestamp", "rsvp date", "updated"],
  dietary:        ["dietary needs", "dietary restrictions", "dietary", "food allergies", "allergies", "restrictions"],
  rsvpNotes:      ["rsvp notes", "rsvp note"],
  inviteDecision: ["invite decision", "selected to invite", "invitation decision", "invite status", "invited", "invite"],
  householdName:  ["household / invitation name", "household name", "invitation name", "invite name"],
};

/* ---------- helpers -------------------------------------------------------- */

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function norm_(s) {
  return String(s == null ? "" : s).trim().toLowerCase().replace(/[.'`’\-]/g, "").replace(/\s+/g, " ");
}
function normHdr_(s) {
  return String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " ");
}
function canonRsvp_(v) {
  var s = String(v == null ? "" : v).trim().toLowerCase();
  if (s === "attending" || s === "accepts" || s === "joyfully accepts" || s === "yes") return "Attending";
  if (s === "declined" || s === "regretfully declines" || s === "no") return "Declined";
  return "Pending";
}

/* ---------- load + map the guest sheet ------------------------------------ */

function loadGuests_() {
  var ss = CONFIG.SHEET_ID ? SpreadsheetApp.openById(CONFIG.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = null;
  if (CONFIG.SHEET_NAME) {
    sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  } else {
    // Auto-find: the tab whose header row has first name + last name + household id.
    var tabs = ss.getSheets();
    for (var t = 0; t < tabs.length; t++) {
      var probe = findHeaderRow_(tabs[t]);
      if (probe) { sheet = tabs[t]; break; }
    }
  }
  if (!sheet) throw new Error("Couldn't find the guest-list worksheet (looked for First/Last/Household ID headers).");

  var hr = findHeaderRow_(sheet);
  if (!hr) throw new Error("Couldn't find the header row in '" + sheet.getName() + "'.");
  var headers = hr.headers, headerRow = hr.row;
  var colMap = buildColMap_(headers);

  var lastRow = sheet.getLastRow(), lastCol = headers.length;
  var rows = [];
  if (lastRow > headerRow) {
    var values = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, lastCol).getValues();
    for (var i = 0; i < values.length; i++) {
      rows.push({ rowNum: headerRow + 1 + i, vals: values[i] });
    }
  }
  return { ss: ss, sheet: sheet, headers: headers, headerRow: headerRow, colMap: colMap, rows: rows };
}

function findHeaderRow_(sheet) {
  var maxProbe = Math.min(12, sheet.getLastRow());
  if (maxProbe < 1) return null;
  var lastCol = Math.max(1, sheet.getLastColumn());
  var block = sheet.getRange(1, 1, maxProbe, lastCol).getValues();
  for (var r = 0; r < block.length; r++) {
    var hdr = block[r].map(normHdr_);
    var hasFirst = hdr.some(function (h) { return /first/.test(h) || h === "given name" || h === "given"; });
    var hasLast = hdr.some(function (h) { return /last|surname|family/.test(h); });
    var hasHh = hdr.some(function (h) { return h.indexOf("household") >= 0 || h === "hh id" || h === "house id"; });
    if (hasFirst && hasLast && hasHh) return { row: r + 1, headers: block[r] };
  }
  return null;
}

function buildColMap_(headers) {
  var normed = headers.map(normHdr_);
  var used = {}, map = {};
  var order = ["guestId", "householdId", "firstName", "lastName", "plusOne", "rsvp", "rsvpUpdated",
    "dietary", "adultChild", "inviteDecision", "rsvpNotes", "householdName"];
  function tryMatch(mode) {
    order.forEach(function (field) {
      if (map[field] != null) return;
      var syns = SYNONYMS[field];
      for (var s = 0; s < syns.length; s++) {
        for (var c = 0; c < normed.length; c++) {
          if (used[c]) continue;
          var h = normed[c], syn = syns[s], hit = false;
          if (mode === 0) hit = (h === syn);
          else if (mode === 1) hit = (h.indexOf(syn) === 0);
          else hit = (h.indexOf(syn) >= 0);
          if (hit) { map[field] = c; used[c] = true; return; }
        }
      }
    });
  }
  tryMatch(0); tryMatch(1); tryMatch(2);
  return map;
}

/* ---------- classify rows -------------------------------------------------- */

function cell_(row, colMap, field) {
  var i = colMap[field];
  return i == null ? "" : row.vals[i];
}
function isInvited_(row, colMap) {
  var i = colMap.inviteDecision;
  if (i == null) return true; // no column -> assume everyone in a household is invited
  var v = norm_(row.vals[i]);
  if (!v) return true;
  if (/(^|\b)(no|not invited|dont invite|do not invite|planning only|skip|exclude)(\b|$)/.test(v)) return false;
  return true;
}
// A reserved/unnamed plus-one placeholder row (vs a named invited person).
function isPlusOneRow_(row, colMap) {
  var fn = norm_(cell_(row, colMap, "firstName"));
  var ln = norm_(cell_(row, colMap, "lastName"));
  var po = norm_(cell_(row, colMap, "plusOne"));
  if (/^(guest|plus ?one|\+?1|tbd|unnamed|and guest|guest of|their guest|plus 1)\b/.test(fn)) return true;
  if (fn.indexOf("guest") >= 0 && !ln) return true;
  if ((po === "1" || /plus|unnamed|reserved/.test(po)) && (!fn || /guest|plus|tbd|unnamed/.test(fn))) return true;
  return false;
}
function keyFor_(row, colMap) {
  var gid = String(cell_(row, colMap, "guestId") || "").trim();
  return gid ? gid : ("row:" + row.rowNum);
}
function rowByKey_(rows, colMap, key) {
  for (var i = 0; i < rows.length; i++) {
    if (keyFor_(rows[i], colMap) === key) return rows[i];
  }
  return null;
}

/* ---------- actions -------------------------------------------------------- */

function lookup_(first, last) {
  var db = loadGuests_();
  var cm = db.colMap;
  if (cm.firstName == null || cm.lastName == null || cm.householdId == null) {
    return { error: "mapping" };
  }
  var nf = norm_(first), nl = norm_(last);
  if (!nf || !nl) return { found: false };

  var match = null;
  for (var i = 0; i < db.rows.length; i++) {
    var row = db.rows[i];
    if (norm_(cell_(row, cm, "firstName")) === nf && norm_(cell_(row, cm, "lastName")) === nl) {
      if (!isInvited_(row, cm)) continue;
      if (isPlusOneRow_(row, cm)) continue; // can't find an invitation via a placeholder
      match = row; break;
    }
  }
  if (!match) return { found: false };

  var hid = String(cell_(match, cm, "householdId")).trim();
  var members = [], plusOnes = [], responded = false;
  for (var j = 0; j < db.rows.length; j++) {
    var r = db.rows[j];
    if (String(cell_(r, cm, "householdId")).trim() !== hid) continue;
    if (!isInvited_(r, cm)) continue;
    var rsvp = canonRsvp_(cell_(r, cm, "rsvp"));
    if (rsvp === "Attending" || rsvp === "Declined") responded = true;
    var diet = String(cell_(r, cm, "dietary") || "");
    if (isPlusOneRow_(r, cm)) {
      plusOnes.push({ slotId: keyFor_(r, cm), hostName: "", firstName: "", lastName: "", rsvp: rsvp, dietary: diet });
    } else {
      members.push({
        guestId: keyFor_(r, cm),
        firstName: String(cell_(r, cm, "firstName") || ""),
        lastName: String(cell_(r, cm, "lastName") || ""),
        rsvp: rsvp, dietary: diet,
      });
    }
  }
  if (!members.length) return { found: false };
  return { found: true, household: { id: hid, alreadyResponded: responded, members: members, plusOnes: plusOnes } };
}

function submit_(payload) {
  if (payload[CONFIG.HONEYPOT]) return { ok: true }; // honeypot -> pretend success, write nothing
  var hid = String(payload.householdId || "").trim();
  if (!hid) return { error: "No household." };
  var db = loadGuests_();
  var cm = db.colMap, sheet = db.sheet;
  var now = new Date();

  function writeRow(row, rsvp, dietary, firstName, lastName) {
    if (String(cell_(row, cm, "householdId")).trim() !== hid) return false; // security: same household only
    if (cm.rsvp != null) sheet.getRange(row.rowNum, cm.rsvp + 1).setValue(rsvp);
    if (cm.dietary != null && rsvp === "Attending") sheet.getRange(row.rowNum, cm.dietary + 1).setValue(dietary || "");
    if (cm.rsvpUpdated != null) sheet.getRange(row.rowNum, cm.rsvpUpdated + 1).setValue(now);
    if (firstName && cm.firstName != null) sheet.getRange(row.rowNum, cm.firstName + 1).setValue(firstName);
    if (lastName && cm.lastName != null) sheet.getRange(row.rowNum, cm.lastName + 1).setValue(lastName);
    return true;
  }

  (payload.responses || []).forEach(function (resp) {
    var row = rowByKey_(db.rows, cm, resp.guestId);
    if (row) writeRow(row, canonRsvp_(resp.rsvp), resp.dietary || "");
  });
  (payload.plusOnes || []).forEach(function (po) {
    var row = rowByKey_(db.rows, cm, po.slotId);
    if (!row) return;
    if (po.bringing) writeRow(row, "Attending", po.dietary || "", (po.firstName || "").trim(), (po.lastName || "").trim());
    else writeRow(row, "Declined", "");
  });
  return { ok: true };
}

/* ---------- admin: diagnose + setup --------------------------------------- */

function diagnose_() {
  var db = loadGuests_();
  var cm = db.colMap;
  var mapping = {};
  Object.keys(SYNONYMS).forEach(function (f) {
    mapping[f] = (cm[f] == null) ? null : db.headers[cm[f]];
  });
  // one sample household (names reduced to initials for privacy)
  var sample = null;
  for (var i = 0; i < db.rows.length; i++) {
    var hid = String(cell_(db.rows[i], cm, "householdId")).trim();
    if (!hid) continue;
    var mem = [], pos = [];
    db.rows.forEach(function (r) {
      if (String(cell_(r, cm, "householdId")).trim() !== hid) return;
      var fn = String(cell_(r, cm, "firstName") || ""), ln = String(cell_(r, cm, "lastName") || "");
      var tag = (fn ? fn[0] : "?") + "." + (ln ? ln[0] : "") + ".";
      if (isPlusOneRow_(r, cm)) pos.push({ initials: tag, plusOne: String(cell_(r, cm, "plusOne") || "") });
      else mem.push({ initials: tag, invited: isInvited_(r, cm), rsvp: canonRsvp_(cell_(r, cm, "rsvp")) });
    });
    if (mem.length >= 1) { sample = { householdId: hid, members: mem, plusOneSlots: pos }; break; }
  }
  return { sheet: db.sheet.getName(), headerRow: db.headerRow, headers: db.headers, mapping: mapping, rowCount: db.rows.length, sampleHousehold: sample };
}

function setupGuestIds_() {
  var db = loadGuests_();
  var cm = db.colMap, sheet = db.sheet;
  var gidCol = cm.guestId;
  if (gidCol == null) {
    gidCol = db.headers.length; // append a new column
    sheet.getRange(db.headerRow, gidCol + 1).setValue("Guest ID");
  }
  var n = 0, counter = 1;
  // find current max G#### to continue numbering
  db.rows.forEach(function (r) {
    var v = String(r.vals[gidCol] || "").trim();
    var m = v.match(/^G(\d+)$/i);
    if (m) counter = Math.max(counter, parseInt(m[1], 10) + 1);
  });
  db.rows.forEach(function (r) {
    var existing = String((r.vals[gidCol] || "")).trim();
    if (!existing) {
      var id = "G" + ("000" + counter).slice(-4); counter++; n++;
      sheet.getRange(r.rowNum, gidCol + 1).setValue(id);
    }
  });
  return { ok: true, assigned: n, guestIdColumn: "col " + (gidCol + 1) };
}

/* ---------- web entrypoints ----------------------------------------------- */

function doPost(e) {
  try {
    var body = {};
    try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ error: "bad request" }); }
    if (body.action === "lookup") return out_(lookup_(body.first, body.last));
    if (body.action === "submit") return out_(submit_(body));
    return out_({ error: "unknown action" });
  } catch (err) {
    return out_({ error: String(err && err.message || err) });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "diagnose" || p.action === "setup") {
    if (p.key !== CONFIG.SETUP_KEY) return out_({ error: "bad key" });
    try { return out_(p.action === "diagnose" ? diagnose_() : setupGuestIds_()); }
    catch (err) { return out_({ error: String(err && err.message || err) }); }
  }
  return out_({ status: "ok", service: "lk-rsvp-household" });
}
