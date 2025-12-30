function scrollToCurrentHash() {
  const hash = decodeURIComponent(window.location.hash || "");
  if (!hash || hash === "#") return;

  const target = document.querySelector(hash);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function includePartials() {
  const targets = Array.from(document.querySelectorAll("[data-include]"));

  await Promise.all(
    targets.map(async (el) => {
      const file = el.getAttribute("data-include");
      try {
        const res = await fetch(file); // consider allowing cache in production
        if (!res.ok) {
          el.innerHTML = "<!-- include failed: " + file + " -->";
          return;
        }
        el.innerHTML = await res.text();
      } catch (e) {
        el.innerHTML = "<!-- include error: " + file + " -->";
      }
    })
  );
   
  // Now that IDs like #contact exist, honor any hash that was clicked early but only if something was newly clicked now stored click info
  if (window._pendingHashClick) {
    const hash = window._pendingHashClick;
    window._pendingHashClick = null;
    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }else{
      // If the target still doesn't exist, fall back to normal hash scrolling
      scrollToCurrentHash();
    }
  }else{    
    scrollToCurrentHash();
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  await includePartials();

  // NEW: signal that partial HTML is now in the page
  document.dispatchEvent(new Event("partials:loaded"));

  window.addEventListener("hashchange", () => {
    setTimeout(scrollToCurrentHash, 0);
  });
});
