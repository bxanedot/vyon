/* Anime.js v4.5.0 motion direction: authored for Vyon, not generic presets.
 * The original physics canvas, reveal class, downloads and EQ remain untouched.
 * Optional enhancement only: content is visible before or without this module.
 */
(async () => {
  "use strict";
  const html = document.documentElement;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches ||
      navigator.connection?.saveData) {
    html.dataset.animeMotion = "skipped";
    return;
  }
  try {
    // Pinned ESM build. Only this page's cinematic moments need the library.
    const { animate, stagger } = await import(
      "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js"
    );
    html.dataset.animeMotion = "ready";
    const heroTargets = [
      ".hero .eyebrow",
      ".hero h1",
      ".hero .hero-description",
      ".hero .hero-buttons-primary",
      ".hero .hero-explore",
      ".hero .hero-footnote"
    ].map(s => document.querySelector(s)).filter(Boolean);
    // Animate only isolated hero children. Avoid parent transforms because
    // the particle scene and original interactions use their own transforms.
    if (heroTargets.length) {
      animate(heroTargets, {
        opacity: [0,1],
        y: [23,0],
        delay: stagger(105),
        duration: 900,
        ease: "outCubic"
      });
    }
    const lab = document.querySelector("#particle-lab");
    if (!lab) return;
    const targets = [
      ".particle-lab-index",
      ".particle-lab-intro h2",
      ".particle-lab-intro p",
      ".particle-lab-next"
    ].map(s=>lab.querySelector(s)).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      observer.disconnect();
      if (targets.length) {
        animate(targets, {
          opacity: [0,1],
          y: [35,0],
          delay: stagger(130),
          duration: 850,
          ease: "outCubic"
        });
      }
      const stage = lab.querySelector(".particle-lab-stage");
      if (stage) animate(stage, {
        opacity: [0,1],
        scale: [.95,1],
        duration: 1050,
        ease: "outCubic"
      });
    }, { rootMargin:"0px 0px -12% 0px", threshold:.18 });
    observer.observe(lab);
    // Gentle one-time reveal of product sculpture cards, without modifying
    // their transform (hover and responsive behavior retain CSS ownership).
    const cards = [...document.querySelectorAll(".platform-card")];
    if (cards.length) {
      const cardObserver = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        cardObserver.disconnect();
        animate(cards, {
          opacity: [0,1],
          delay: stagger(90),
          duration: 740,
          ease:"outCubic"
        });
      }, {rootMargin:"0px 0px -10% 0px",threshold:.1});
      cardObserver.observe(document.querySelector(".platform-grid"));
    }
  } catch (e) {
    html.dataset.animeMotion = "fallback";
    // Content never starts hidden, so connectivity issues cannot break UX.
    console.info("Anime.js unavailable; Vyon is usable without enhanced entrances.");
  }
})();