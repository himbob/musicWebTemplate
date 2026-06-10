"use strict";

(function () {
  const SONGS_URL = "data/songs.json?v=" + Date.now();

  function pageName() {
    return (window.location.pathname || "").split("/").pop().toLowerCase() || "index.html";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function attr(value) {
    return String(value ?? "").replaceAll('"', "%22").trim();
  }

  function cssToken(value) {
    return String(value || "song")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "song";
  }

  function pickPrimaryLink(song) {
    const links = song && song.links ? song.links : {};
    return links.listen || links.youtube || links.spotify || links.review || "";
  }

  function linkLabel(key) {
    const labels = {
      listen: "Listen",
      spotify: "Spotify",
      youtube: "YouTube",
      review: "Review"
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  function renderLinkButtons(song, includeOpen) {
    const links = song && song.links ? song.links : {};
    const order = ["listen", "spotify", "youtube", "review"];
    const buttons = [];

    order.forEach((key) => {
      if (!links[key]) return;
      const primary = buttons.length === 0 ? " btnPrimary" : "";
      buttons.push(`<a class="btn${primary}" href="${attr(links[key])}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkLabel(key))}</a>`);
    });

    if (includeOpen) {
      buttons.push(`<a class="btn" href="song.html?id=${encodeURIComponent(song.id)}">Details</a>`);
    } else {
      buttons.push(`<a class="btn" href="songs.html">All songs</a>`);
    }

    return buttons.join("");
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

    if (!songs.length) {
      target.innerHTML = `<div class="emptyState small">No songs are listed yet.</div>`;
      return;
    }

    target.innerHTML = songs.map((song) => {
      const title = escapeHtml(song.title || "Untitled song");
      const tagline = escapeHtml(song.tagline || "");
      const image = attr(song.image || "");
      const detailUrl = `song.html?id=${encodeURIComponent(song.id || "")}`;
      const primaryLink = pickPrimaryLink(song);
      const titleHref = primaryLink || detailUrl;
      const isExternal = /^https?:\/\//.test(titleHref);
      const externalAttrs = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";

      return `
        <article class="songCard songCard-${cssToken(song.id || title)}">
          <a href="${attr(detailUrl)}" aria-label="Open details for ${title}">
            <img class="songCardImage" src="${image}" alt="${title}">
          </a>
          <div class="songCardBody">
            <h2 class="songCardTitle"><a href="${attr(titleHref)}"${externalAttrs}>${title}</a></h2>
            ${tagline ? `<p class="songCardText">${tagline}</p>` : ""}
            <div class="songActions">${renderLinkButtons(song, true)}</div>
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

    const title = escapeHtml(song.title || "Untitled song");
    const tagline = escapeHtml(song.tagline || "");
    const about = escapeHtml(song.about || "");
    const image = attr(song.image || "");

    document.title = `${song.title} | Aaron Ruddick`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", song.tagline || song.about || "Aaron Ruddick song page.");

    target.innerHTML = `
      <div class="songDetailGrid">
        <div>
          <img class="songDetailCover" src="${image}" alt="${title}">
        </div>
        <div class="songDetailCopy">
          <div class="pageKicker">Aaron Ruddick song</div>
          <h1 class="title">${title}</h1>
          ${tagline ? `<p class="sub">${tagline}</p>` : ""}
          <div class="songMetaLine">Memory · story · cinematic songwriter</div>
          <div class="linksRow">${renderLinkButtons(song, false)}</div>
          ${about ? `<section class="songAbout card spacerTop"><div class="cardPad"><div class="cardTitle">About</div><p class="small">${about}</p></div></section>` : ""}
        </div>
      </div>
    `;
  }

  function showError(err) {
    console.error(err);
    const target = document.getElementById("songs-list") || document.getElementById("song-detail");
    if (target) {
      target.innerHTML = `<div class="emptyState small">Could not load the song data. ${escapeHtml(err.message || err)}</div>`;
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
