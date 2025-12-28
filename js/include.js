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

  // Now that IDs like #contact exist, honor any hash that was clicked early
  scrollToCurrentHash();
}

document.addEventListener("DOMContentLoaded", async () => {
  await includePartials();

  // If hash changes later, scroll after the browser updates the URL
  window.addEventListener("hashchange", () => {
    setTimeout(scrollToCurrentHash, 0);
  });
});
