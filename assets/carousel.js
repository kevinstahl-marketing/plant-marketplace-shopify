(() => {
  if (window.__marketplaceCarousel) return;
  window.__marketplaceCarousel = true;

  const instances = new WeakMap();
  const selector = '[data-carousel]';

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
      const left = Math.max(0, track.scrollLeft);

      if (controls) controls.hidden = !scrollable;
      if (prev) prev.disabled = !scrollable || left <= 2;
      if (next) next.disabled = !scrollable || left >= max - 2;
    };

    const move = (direction) => {
      if (!isCarousel()) return;

      const card = track.querySelector('[data-carousel-item]');
      if (!card) return;

      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const distance = card.getBoundingClientRect().width + gap;

      track.scrollBy({
        left: distance * direction,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth'
      });
    };

    const onPrev = () => move(-1);
    const onNext = () => move(1);

    prev?.addEventListener('click', onPrev);
    next?.addEventListener('click', onNext);
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    const observer = new ResizeObserver(update);
    observer.observe(track);

    instances.set(root, () => {
      prev?.removeEventListener('click', onPrev);
      next?.removeEventListener('click', onNext);
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
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
    roots.forEach(root => instances.get(root)?.());
  }

  window.MarketplaceCarousel = {
    refresh(scope = document) {
      destroyAll(scope);
      initializeAll(scope);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeAll());
  } else {
    initializeAll();
  }

  document.addEventListener('shopify:section:unload', event => {
    destroyAll(event.target);
  });

  document.addEventListener('shopify:section:load', event => {
    initializeAll(event.target);
  });
})();
