/* artist/assets/js/artist.js
   Builds the Artist page Music grid directly from ../data/songs.json
   Tile click goes straight to YouTube (or Spotify fallback).

   Also handles fan signup via Formspree using AJAX (no redirect).
*/

(function () {
  // Footer year
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // -----------------------------
  // Fan signup (Formspree AJAX)
  // -----------------------------
  const signupForm = document.getElementById("fan-signup-form");
  const signupStatus = document.getElementById("signup-status");

  function setStatus(message, kind) {
    if (!signupStatus) return;
    signupStatus.textContent = message || "";
    signupStatus.classList.remove("ok", "bad");
    if (kind) signupStatus.classList.add(kind);
  }

  function normalizePhone(raw) {
    // Keep digits and leading +
    if (!raw) return "";
    const trimmed = String(raw).trim();
    // If they started with +, keep it, otherwise just digits
    const hasPlus = trimmed.startsWith("+");
    const digits = trimmed.replace(/[^\d]/g, "");
    return hasPlus ? "+" + digits : digits;
  }

  function isPlausiblePhone(raw) {
    // Optional field: empty is fine.
    const p = normalizePhone(raw);
    if (!p) return true;

    // Loose validation: 10-15 digits (covers US and most international formats)
    const digits = p.startsWith("+") ? p.slice(1) : p;
    if (digits.length < 10 || digits.length > 15) return false;
    return /^[0-9]+$/.test(digits);
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const emailEl = document.getElementById("signup-email");
    const phoneEl = document.getElementById("signup-phone");

    setStatus("", null);

    // Email validation (use browser validity first)
    if (emailEl && !emailEl.checkValidity()) {
      // Shows the browser's native message
      emailEl.reportValidity();
      setStatus("Please enter a valid email address.", "bad");
      return;
    }

    // Phone validation (optional)
    const phoneVal = phoneEl ? phoneEl.value : "";
    if (!isPlausiblePhone(phoneVal)) {
      setStatus("That phone number looks off. Try 10 to 15 digits, or leave it blank.", "bad");
      if (phoneEl) phoneEl.focus();
      return;
    }

    // If you added a honeypot (_gotcha) and it has a value, silently stop.
    const gotcha = form.querySelector('input[name="_gotcha"]');
    if (gotcha && gotcha.value) return;

    const data = new FormData(form);

    // Normalize phone before sending (optional)
    if (phoneEl) {
      const normalized = normalizePhone(phoneEl.value);
      data.set("phone", normalized);
    }

    try {
      const res = await fetch(form.action, {
        method: form.method || "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("Thanks. You are on the list.", "ok");
        form.reset();
        return;
      }

      // Try to show Formspree error messages
      let payload = null;
      try {
        payload = await res.json();
      } catch (e) {
        payload = null;
      }

      if (payload && Object.hasOwn(payload, "errors")) {
        const msg = payload.errors.map((x) => x.message).join(", ");
        setStatus(msg || "Oops. There was a problem submitting the form.", "bad");
      } else {
        setStatus("Oops. There was a problem submitting the form.", "bad");
      }
    } catch (err) {
      console.error(err);
      setStatus("Network error. Please try again.", "bad");
    }
  }

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
  }

  // -----------------------------
  // Music grid
  // -----------------------------
  const grid = document.getElementById("artist-music-grid");
  if (!grid) return;

  const ui = window.AaronSongUI;

  async function loadSongs() {
    const url = ui.sitePrefix() + "data/songs.json?v=" + Date.now();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load songs.json: " + res.status);
    const songs = await res.json();
    if (!Array.isArray(songs)) throw new Error("songs.json must be an array");
    return songs;
  }

  function renderTiles(songs) {
    const maxTiles = 8;
    const items = Array.isArray(songs) ? songs.slice(0, maxTiles) : [];

    ui.injectJsonLd("artist-schema", ui.artistSchema());
    if (items[0]) ui.injectJsonLd("current-song-schema", ui.songSchema(items[0]));

    if (!items.length) {
      grid.innerHTML = `<div class="small">No songs found.</div>`;
      return;
    }

    grid.innerHTML = items
      .map((song) => {
        const title = ui.escapeHtml(song.title || "Untitled song");
        const tagline = ui.escapeHtml(song.tagline || "");
        const imgSrc = ui.attr(ui.fromSiteRoot(song.image || ""));
        const detailUrl = ui.attr(ui.detailUrl(song));
        const tileClass = "musicTile songTile-" + ui.cssToken(song.id || title);
        const imageClass = ui.imageFitClass(song, "tileImage");

        return `
          <article class="${tileClass}">
            <a class="tileArtwork" href="${detailUrl}" aria-label="Open details for ${title}">
              <img class="${imageClass}" src="${imgSrc}" alt="${title}">
            </a>
            <div class="tilePad">
              <div class="tileTitle"><a href="${detailUrl}">${title}</a></div>
              ${tagline ? `<div class="tileTag">${tagline}</div>` : ""}
              <div class="tileActions">${ui.renderLinkButtons(song, { includeDetails: true, compact: true })}</div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  (async function init() {
    try {
      const songs = await loadSongs();
      renderTiles(songs);
    } catch (e) {
      console.error(e);
      grid.innerHTML = `<div class="small">Could not load songs right now.</div>`;
    }
  })();
})();
