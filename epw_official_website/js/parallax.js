/**
 * parallax.js
 * ------------------------------------------------------------------
 * Mueve los elementos con [data-parallax="velocidad"] a una fracción
 * de la velocidad del scroll, creando profundidad. Se desactiva por
 * completo si el usuario tiene activado "reducir movimiento".
 * ------------------------------------------------------------------
 */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layers = document.querySelectorAll("[data-parallax]");
  if (prefersReduced || !layers.length) return;

  let ticking = false;

  function update() {
    const y = window.scrollY;
    layers.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      el.style.transform = `translate3d(0, ${Math.round(y * speed)}px, 0)`;
    });
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
})();
