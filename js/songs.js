"use strict";

const SONGS_URL = new URL("data/songs.json", document.baseURI).toString();

function pageName() {
  const p = (window.location.pathname || "").split("/").pop() || "";
  return p.toLowerCase();
}

function isSongsPage() {
  return pageName() === "songs.html";
}

function isSongDetailPage() {
  return pageName() === "song.html";
}

/*
  Your site injects partials async.
  We run after:
    1) partials:loaded (best case)
    2) OR when we can see a real target container in the DOM (fallback)
*/
function onReady(cb) {
  let fired = false;
  const run = () => {
    if (fired) return;
    fired = true;
    cb();
  };

  // Best case: include.js fires this after injection
  document.addEventListener("partials:loaded", run, { once: true });

  // Fallback: wait until an element we need actually exists
  document.addEventListener("DOMContentLoaded", () => {
    waitForTargets(run);
  }, { once: true });
}

function waitForTargets(cb) {
  const start = Date.now();
  const timeoutMs = 6000;

  function hasTargets() {
    // songs page partial uses #songsList
    if (document.getElementById("songsList")) return true;

    // home page music partial should use #music-grid
    if (document.getElementById("music-grid")) return true;

    // song detail page uses #song-page
    if (document.getElementById("song-page")) return true;

    return false;
  }

  function tick() {
    if (hasTargets()) {
      cb();
      return;
    }
    if (Date.now() - start > timeoutMs) {
      // Give up quietly but keep a breadcrumb
      console.warn("songs.js: targets not found after waiting");
      cb(); // still run, it will no-op safely
      return;
    }
    setTimeout(tick, 40);
  }

  tick();
}

onReady(() => {
  loadAndRenderSongs();
});

async function loadAndRenderSongs() {
  let songs;

  try {
    const res = await fetch(SONGS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    songs = await res.json();
    if (!Array.isArray(songs)) throw new Error("songs.json must be an array");
  } catch (err) {
    showSongsError(err);
    return;
  }

  // Home page tiles
  renderMusicTiles(songs);

  // Songs list page cards
  renderSongsListPage(songs);

  // Song detail page
  renderSongPage(songs);
}

/*
  Home page grid (partials/music.html)
  Preferred: id="music-grid"
  Legacy: id="songsList" but only use that on index, not on songs.html
*/
function renderMusicTiles(songs) {
  let grid = document.getElementById("music-grid");

  // Legacy support: if someone used songsList on the home page
  if (!grid && !isSongsPage()) {
    grid = document.getElementById("songsList");
  }

  if (!grid) return;

  grid.innerHTML = "";

  songs.forEach(song => {
    const a = document.createElement("a");
    a.className = "music-tile";
    a.href = `song.html?id=${encodeURIComponent(song.id)}`;

    a.innerHTML = `
      <img src="${attr(song.image)}" alt="${escapeHtml(song.title)}">
      <div class="music-tile-title">${escapeHtml(song.title)}</div>
    `;

    grid.appendChild(a);
  });
}

/*
  Songs list page (partials/songs_page.html)
  Your partial uses id="songsList"
*/
function renderSongsListPage(songs) {
  if (!isSongsPage()) return;

  const list = document.getElementById("songsList");
  if (!list) return;

  list.innerHTML = "";

  // Render as card grid (matches your newer CSS)
  const wrap = document.createElement("div");
  wrap.className = "songs-grid";

  songs.forEach(song => {
    const card = document.createElement("article");
    card.className = "song-card";

    const spotify = song.links && song.links.spotify ? song.links.spotify : "";
    const youtube = song.links && song.links.youtube ? song.links.youtube : "";

    card.innerHTML = `
      <a class="song-cover-link" href="song.html?id=${encodeURIComponent(song.id)}">
        <img class="song-cover" src="${attr(song.image)}" alt="${escapeHtml(song.title)}">
      </a>

      <div class="song-content">
        <h4 class="song-title">${escapeHtml(song.title)}</h4>
        ${song.tagline ? `<p class="song-tagline">${escapeHtml(song.tagline)}</p>` : ""}

        <div class="song-links">
          ${spotify ? `<a class="song-link" href="${attr(spotify)}" target="_blank" rel="noopener noreferrer">Spotify</a>` : ""}
          ${youtube ? `<a class="song-link" href="${attr(youtube)}" target="_blank" rel="noopener noreferrer">YouTube</a>` : ""}
          <a class="song-link" href="song.html?id=${encodeURIComponent(song.id)}">Open</a>
        </div>
      </div>
    `;

    wrap.appendChild(card);
  });

  list.appendChild(wrap);
}

/*
  Song detail page (song.html)
  Fills #song-page
  You said no lyrics on any, so we will not show Lyrics section at all
*/
function renderSongPage(songs) {
  if (!isSongDetailPage()) return;

  const el = document.getElementById("song-page");
  if (!el) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const song = songs.find(s => String(s.id) === String(id));

  if (!song) {
    el.innerHTML = `
      <div style="text-align:center; padding: 30px;">
        <h2>Song not found</h2>
        <p>That song id is not in data/songs.json.</p>
        <p><a href="songs.html">Back to music</a></p>
      </div>
    `;
    return;
  }

  const spotify = song.links && song.links.spotify ? song.links.spotify : "";
  const youtube = song.links && song.links.youtube ? song.links.youtube : "";

  const coverHtml = youtube
    ? `<a class="song-cover-link" href="${attr(youtube)}" target="_blank" rel="noopener noreferrer">
         <img src="${attr(song.image)}" class="song-cover-large" alt="${escapeHtml(song.title)}">
       </a>`
    : `<img src="${attr(song.image)}" class="song-cover-large" alt="${escapeHtml(song.title)}">`;

  el.innerHTML = `
    <div class="song-detail-wrap">
      ${coverHtml}

      <h1>${escapeHtml(song.title)}</h1>

      ${song.tagline ? `<p class="song-tagline">${escapeHtml(song.tagline)}</p>` : ""}

      <div class="song-links">
        ${spotify ? `<a class="song-link" href="${attr(spotify)}" target="_blank" rel="noopener noreferrer">Spotify</a>` : ""}
        ${youtube ? `<a class="song-link" href="${attr(youtube)}" target="_blank" rel="noopener noreferrer">YouTube</a>` : ""}
        <a class="song-link" href="songs.html">All songs</a>
      </div>

      ${song.about ? `
        <section class="song-about">
          <h2>About</h2>
          <p>${escapeHtml(song.about)}</p>
        </section>
      ` : ""}
    </div>
  `;
}

function showSongsError(err) {
  const grid = document.getElementById("music-grid") || document.getElementById("songsList");
  if (grid) {
    grid.innerHTML = `
      <p style="text-align:center; color:#000;">
        Could not load songs. ${escapeHtml(err.message || String(err))}
      </p>
    `;
  }
  console.error("Songs load failed", err);
}

/* Escape only visible text content */
function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Attribute safe value */
function attr(v) {
  return String(v ?? "").replaceAll('"', "%22").trim();
}
