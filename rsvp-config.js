// RSVP endpoint configuration.
//
// RSVP_LOOKUP_ENDPOINT — the new Zola-style household RSVP (guests find their
//   invitation by name, respond for their whole party). This is what the live
//   #rsvp tab on index.html uses. Deploy apps-script/rsvp-household.gs as a Web
//   App (see apps-script/RSVP-SETUP.md), paste its /exec URL below, commit +
//   push. While it's empty, the RSVP tab shows a friendly "opens soon" notice.
window.RSVP_LOOKUP_ENDPOINT = "";

// RSVP_ENDPOINT — the OLD single-form RSVP (name + attending → emails the
//   couple). No longer wired into the main site; kept for reference only.
window.RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbzWUQdf_aT_MNU1fI6Dfh3h5hR3qaZN9nvhQAyJZ3kTPT7kqvKWrV-YoLQjUEAkaFOgKA/exec";
