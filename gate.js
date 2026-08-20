/* Lily & Kremer — private-site password gate.
 * A single shared password unlocks the site; the guest is remembered
 * (localStorage) so they only type it once. Only the SHA-256 hash of the
 * password lives here — never the password itself. This is a light gate to
 * keep the site out of public/casual view, not hardened security: the page
 * markup is still delivered by a static host. Change the password by
 * replacing HASH below with the SHA-256 of the new one. */
(function () {
  "use strict";

  // SHA-256 of the shared entry password.
  var HASH = "63a8ae3a35554ede20b1f3dee80c4ccca1d287f5cc655d984fc02a6dc53e0111";

  var root = document.documentElement;

  // If the password was changed since this guest last entered, drop the stale
  // unlock so they're asked again.
  var stored = null;
  try { stored = localStorage.getItem("lk_gate"); } catch (e) {}
  if (stored && stored !== HASH) {
    try { localStorage.removeItem("lk_gate"); } catch (e) {}
    root.classList.remove("lk-unlocked");
  }

  // Already verified (the inline <head> script added the class) — nothing to do.
  if (root.classList.contains("lk-unlocked")) return;

  var form = document.getElementById("lk-gate-form");
  var input = document.getElementById("lk-gate-input");
  var errEl = document.getElementById("lk-gate-error");
  if (!form || !input) return;

  try { input.focus(); } catch (e) {}

  function toHex(buf) {
    var b = new Uint8Array(buf), s = "", i;
    for (i = 0; i < b.length; i++) { s += (b[i] < 16 ? "0" : "") + b[i].toString(16); }
    return s;
  }

  function fail(msg) {
    if (errEl) {
      errEl.textContent = msg || "That doesn’t match — please check your invitation and try again.";
      errEl.classList.add("show");
    }
    form.classList.add("shake");
    setTimeout(function () { form.classList.remove("shake"); }, 450);
    input.value = "";
    try { input.focus(); } catch (e) {}
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = (input.value || "").trim().toLowerCase();
    if (!v) { fail("Enter the password from your invitation."); return; }
    if (!(window.crypto && window.crypto.subtle && window.TextEncoder)) {
      fail("Please open this in a newer browser to enter.");
      return;
    }
    window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)).then(function (buf) {
      if (toHex(buf) === HASH) {
        try { localStorage.setItem("lk_gate", HASH); } catch (e) {}
        root.classList.add("lk-unlocked");
        try { input.blur(); } catch (e) {}
      } else {
        fail();
      }
    }).catch(function () { fail(); });
  });
})();
