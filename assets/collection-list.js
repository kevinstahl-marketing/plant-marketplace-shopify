(() => {
  if (window.CollectionListCarouselInitialized) return;
  window.CollectionListCarouselInitialized = true;

  const selector = '[data-collection-list]';
  const instances = new WeakMap();

  function initialize(root) {
    if (instances.has(root)) return;

    const track = root.querySelector('[data-carousel-track]');
    if (!track) return;

    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    const controls = root.querySelector('[data-carousel-controls]');

    const isCarousel = () => {
      const mobile = window.matchMedia('(max-width: 749px)').matches;
      return mobile
        ? root.dataset.mobileLayout === 'carousel'
        : root.dataset.desktopLayout === 'carousel';
    };

    const update = () => {
      const active = isCarousel();
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const scrollable = active && max > 2;
      const current = Math.abs(track.scrollLeft);

      if (controls) controls.hidden = !scrollable;
      if (prev) prev.disabled = !scrollable || current <= 2;
      if (next) next.disabled = !scrollable || current >= max - 2;
    };

    const move = (direction) => {
      if (!isCarousel()) return;

      const card = track.querySelector('.collection-list__card');
      if (!card) return;

      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const distance = card.getBoundingClientRect().width + gap;

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      track.scrollBy({
        left: direction * distance,
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    };

    const onPrev = () => move(-1);
    const onNext = () => move(1);

    prev?.addEventListener('click', onPrev);
    next?.addEventListener('click', onNext);
    track.addEventListener('scroll', update, { passive: true });

    const observer = new ResizeObserver(update);
    observer.observe(track);

    const onResize = () => update();
    window.addEventListener('resize', onResize, { passive: true });

    instances.set(root, () => {
      prev?.removeEventListener('click', onPrev);
      next?.removeEventListener('click', onNext);
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      instances.delete(root);
    });

    requestAnimationFrame(update);
  }

  function initializeAll(scope = document) {
    if (scope.matches?.(selector)) initialize(scope);
    scope.querySelectorAll(selector).forEach(initialize);
  }

  function destroyAll(scope) {
    const roots = [
      ...(scope.matches?.(selector) ? [scope] : []),
      ...scope.querySelectorAll(selector)
    ];

    roots.forEach((root) => instances.get(root)?.());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeAll());
  } else {
    initializeAll();
  }

  document.addEventListener('shopify:section:unload', (event) => {
    destroyAll(event.target);
  });

  document.addEventListener('shopify:section:load', (event) => {
    initializeAll(event.target);
  });
})();
