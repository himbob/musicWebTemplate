"use strict";

window.AaronSongUI = (function () {
  const SITE_URL = "https://www.aaronruddick.com";
  const ARTIST_NAME = "Aaron Ruddick";
  const LINK_ORDER = ["spotify", "youtube", "listen", "review", "appleMusic", "amazonMusic"];
  const LINK_LABELS = {
    spotify: "Spotify",
    youtube: "YouTube",
    listen: "Listen",
    review: "Review",
    appleMusic: "Apple Music",
    amazonMusic: "Amazon Music"
  };

  function pageOrigin() {
    if (window.location && /^https?:/.test(window.location.origin)) return window.location.origin;
    return SITE_URL;
  }

  function sitePrefix() {
    return window.location.pathname.includes("/artist/") ? "../" : "";
  }

  function fromSiteRoot(path) {
    if (!path) return "";
    const clean = String(path).replace(/^\.\//, "");
    if (/^https?:\/\//.test(clean)) return clean;
    if (clean.startsWith("/")) return clean;
    return sitePrefix() + clean;
  }

  function absoluteUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    return pageOrigin() + "/" + String(path).replace(/^\/?/, "");
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

  function linkLabel(key) {
    return LINK_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  function detailUrl(song) {
    return `${sitePrefix()}song.html?id=${encodeURIComponent(song.id || "")}`;
  }

  function imageFitClass(song, baseClass) {
    return song && song.imageFit === "contain" ? `${baseClass} ${baseClass}--contain` : baseClass;
  }

  function orderedLinks(song) {
    const links = song && song.links ? song.links : {};
    const ordered = [];

    LINK_ORDER.forEach((key) => {
      if (links[key]) ordered.push([key, links[key]]);
    });

    Object.keys(links).forEach((key) => {
      if (!LINK_ORDER.includes(key) && links[key]) ordered.push([key, links[key]]);
    });

    return ordered;
  }

  function renderLinkButtons(song, options = {}) {
    const includeDetails = options.includeDetails !== false;
    const includeAllSongs = Boolean(options.includeAllSongs);
    const compact = Boolean(options.compact);
    const classes = compact ? "btn btnCompact" : "btn";
    const buttons = [];

    orderedLinks(song).forEach(([key, url], index) => {
      const primary = index === 0 ? " btnPrimary" : "";
      buttons.push(`<a class="${classes}${primary}" href="${attr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkLabel(key))}</a>`);
    });

    if (includeDetails) {
      buttons.push(`<a class="${classes}" href="${attr(detailUrl(song))}">Details</a>`);
    }

    if (includeAllSongs) {
      buttons.push(`<a class="${classes}" href="${sitePrefix()}songs.html">All songs</a>`);
    }

    return buttons.join("");
  }

  function songDescription(song) {
    return song.tagline || song.about || `${song.title || "Song"} by ${ARTIST_NAME}.`;
  }

  function songSchema(song) {
    const sameAs = orderedLinks(song).map(([, url]) => url);
    const data = {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": song.title || "Untitled song",
      "description": songDescription(song),
      "byArtist": {
        "@type": "MusicGroup",
        "name": ARTIST_NAME,
        "url": pageOrigin() + "/"
      },
      "url": pageOrigin() + "/song.html?id=" + encodeURIComponent(song.id || ""),
      "image": absoluteUrl(song.image || "")
    };

    if (song.releaseDate) data.datePublished = song.releaseDate;
    if (sameAs.length) data.sameAs = sameAs;
    return data;
  }

  function songListSchema(songs) {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Aaron Ruddick songs",
      "itemListElement": songs.map((song, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": pageOrigin() + "/song.html?id=" + encodeURIComponent(song.id || ""),
        "name": song.title || "Untitled song"
      }))
    };
  }

  function artistSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      "name": ARTIST_NAME,
      "url": pageOrigin() + "/",
      "sameAs": [
        "https://open.spotify.com/artist/1kTKYkeaNmBaThYCrIlWmU",
        "https://www.youtube.com/@aaron.ruddick",
        "https://music.apple.com/us/artist/aaron-ruddick/1789224584",
        "https://www.amazon.com/music/player/artists/B0DSGNPM4B/aaron-ruddick"
      ]
    };
  }

  function injectJsonLd(id, data) {
    if (!data) return;
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  function upsertMeta(selector, attrName, value) {
    if (!value) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      const match = selector.match(/meta\[(name|property)="([^"]+)"\]/);
      if (match) el.setAttribute(match[1], match[2]);
      document.head.appendChild(el);
    }
    el.setAttribute(attrName, value);
  }

  function setSongMeta(song) {
    const title = `${song.title || "Song"} | ${ARTIST_NAME}`;
    const desc = songDescription(song);
    const image = absoluteUrl(song.image || "");
    const url = pageOrigin() + "/song.html?id=" + encodeURIComponent(song.id || "");

    document.title = title;
    upsertMeta('meta[name="description"]', "content", desc);
    upsertMeta('meta[property="og:title"]', "content", title);
    upsertMeta('meta[property="og:description"]', "content", desc);
    upsertMeta('meta[property="og:image"]', "content", image);
    upsertMeta('meta[property="og:url"]', "content", url);
    upsertMeta('meta[property="og:type"]', "content", "music.song");
    upsertMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "content", title);
    upsertMeta('meta[name="twitter:description"]', "content", desc);
    upsertMeta('meta[name="twitter:image"]', "content", image);
  }

  return {
    ARTIST_NAME,
    SITE_URL,
    absoluteUrl,
    artistSchema,
    attr,
    cssToken,
    detailUrl,
    escapeHtml,
    fromSiteRoot,
    imageFitClass,
    injectJsonLd,
    orderedLinks,
    renderLinkButtons,
    setSongMeta,
    sitePrefix,
    songListSchema,
    songSchema
  };
})();
