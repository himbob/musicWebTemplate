"use strict";

(function () {
  const SONGS_URL = "data/songs.json?v=" + Date.now();
  const ui = window.AaronSongUI;

  function pageName() {
    return (window.location.pathname || "").split("/").pop().toLowerCase() || "index.html";
  }

  async function loadSongs() {
    const res = await fetch(SONGS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load songs.json: " + res.status);
    const songs = await res.json();
    if (!Array.isArray(songs)) throw new Error("songs.json must be an array");
    return songs;
  }

  function renderSongsList(songs) {
    const target = document.getElementById("songs-list");
    if (!target) return;

    ui.injectJsonLd("songs-list-schema", ui.songListSchema(songs));

    if (!songs.length) {
      target.innerHTML = `<div class="emptyState small">No songs are listed yet.</div>`;
      return;
    }

    target.innerHTML = songs.map((song) => {
      const title = ui.escapeHtml(song.title || "Untitled song");
      const tagline = ui.escapeHtml(song.tagline || "");
      const image = ui.attr(ui.fromSiteRoot(song.image || ""));
      const detailUrl = ui.attr(ui.detailUrl(song));
      const imageClass = ui.imageFitClass(song, "songCardImage");

      return `
        <article class="songCard songCard-${ui.cssToken(song.id || title)}">
          <a href="${detailUrl}" aria-label="Open details for ${title}">
            <img class="${imageClass}" src="${image}" alt="${title}">
          </a>
          <div class="songCardBody">
            <h2 class="songCardTitle"><a href="${detailUrl}">${title}</a></h2>
            ${tagline ? `<p class="songCardText">${tagline}</p>` : ""}
            <div class="songActions">${ui.renderLinkButtons(song, { includeDetails: true, compact: true })}</div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderSongDetail(songs) {
    const target = document.getElementById("song-detail");
    if (!target) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || "";
    const song = songs.find((item) => String(item.id) === String(id));

    if (!song) {
      document.title = "Song not found | Aaron Ruddick";
      target.innerHTML = `
        <div class="emptyState">
          <div class="cardTitle">Song not found</div>
          <p class="small">That song id is not in data/songs.json.</p>
          <div class="linksRow"><a class="btn btnPrimary" href="songs.html">Back to songs</a></div>
        </div>
      `;
      return;
    }

    ui.setSongMeta(song);
    ui.injectJsonLd("song-detail-schema", ui.songSchema(song));

    const title = ui.escapeHtml(song.title || "Untitled song");
    const tagline = ui.escapeHtml(song.tagline || "");
    const about = ui.escapeHtml(song.about || "");
    const image = ui.attr(ui.fromSiteRoot(song.image || ""));
    const imageClass = ui.imageFitClass(song, "songDetailCover");
    const released = song.releaseDate ? `<div class="songMetaLine">Released ${ui.escapeHtml(song.releaseDate)} · Aaron Ruddick</div>` : `<div class="songMetaLine">Aaron Ruddick song</div>`;

    target.innerHTML = `
      <div class="songDetailGrid">
        <div>
          <img class="${imageClass}" src="${image}" alt="${title}">
        </div>
        <div class="songDetailCopy">
          <div class="pageKicker">Aaron Ruddick song</div>
          <h1 class="title">${title}</h1>
          ${tagline ? `<p class="sub">${tagline}</p>` : ""}
          ${released}
          <div class="linksRow">${ui.renderLinkButtons(song, { includeDetails: false, includeAllSongs: true })}</div>
          ${about ? `<section class="songAbout card spacerTop"><div class="cardPad"><div class="cardTitle">About</div><p class="small">${about}</p></div></section>` : ""}
        </div>
      </div>
    `;
  }

  function showError(err) {
    console.error(err);
    const target = document.getElementById("songs-list") || document.getElementById("song-detail");
    if (target) {
      target.innerHTML = `<div class="emptyState small">Could not load the song data. ${ui.escapeHtml(err.message || err)}</div>`;
    }
  }

  async function init() {
    if (pageName() !== "songs.html" && pageName() !== "song.html") return;
    try {
      const songs = await loadSongs();
      renderSongsList(songs);
      renderSongDetail(songs);
    } catch (err) {
      showError(err);
    }
  }

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();
