async function includePartials() {
  const targets = document.querySelectorAll("[data-include]");

  for (const el of targets) {
    const file = el.getAttribute("data-include");
    try {
      const res = await fetch(file, { cache: "no-store" });
      if (!res.ok) {
        el.innerHTML = "<!-- include failed: " + file + " -->";
        continue;
      }
      el.innerHTML = await res.text();
    } catch (e) {
      el.innerHTML = "<!-- include error: " + file + " -->";
    }
  }
}

document.addEventListener("DOMContentLoaded", includePartials);
