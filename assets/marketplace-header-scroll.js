(() => {
  const SELECTOR = '.marketplace-header[data-scroll-visibility]';
  const controllers = new WeakMap();

  function init(header) {
    controllers.get(header)?.abort();

    const controller = new AbortController();
    controllers.set(header, controller);
    const signal = controller.signal;

    const numeric = (name, fallback) => {
      const raw = header.dataset[name];
      if (raw == null || raw === '') return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };

    const enabled = (name, fallback) => {
      const raw = header.dataset[name];
      return raw == null ? fallback : raw === 'true';
    };

    const visibility = header.dataset.scrollVisibility;
    const threshold = numeric('scrollThreshold', 80);
    const revealDistance = numeric('scrollRevealDistance', 45);
    const hideDistance = numeric('scrollHideDistance', 35);

    const closeOnScroll =
      enabled('scrollCloseMobileMenu', true);

    const protect =
      enabled('scrollProtectInteractions', true);

    const revealOnHover =
      enabled('scrollRevealOnHover', false);

    const revealNearTop =
      enabled('scrollRevealNearTop', true);

    let lastY = Math.max(0, window.scrollY);
    let direction = 0;
    let distance = 0;
    let hidden = false;
    let keyboardMode = false;
    let ticking = false;
    let menuScrollDistance = 0;

    const mobileMenu = () =>
      header.querySelector('.marketplace-mobile-nav');

    function closeMobileMenu() {
      const menu = mobileMenu();
      if (!menu?.open) return;

      menu.querySelectorAll('details[open]').forEach(
        item => { item.open = false; }
      );

      menu.open = false;

      // Don't retain pointer focus on a closed hamburger.
      if (
        !keyboardMode &&
        menu.contains(document.activeElement)
      ) {
        document.activeElement.blur?.();
      }
    }

    function interacting() {
      if (!protect) return false;

      const desktopMenuOpen = !!header.querySelector(
        '.header__dropdown[open]'
      );

      const keyboardFocus =
        keyboardMode &&
        header.contains(document.activeElement);

      const hover =
        revealOnHover &&
        window.matchMedia('(hover: hover)').matches &&
        header.matches(':hover');

      return desktopMenuOpen || keyboardFocus || hover;
    }

    function setHidden(value) {
      hidden = value;
      header.classList.toggle('is-hidden', hidden);
      header.setAttribute(
        'data-header-hidden',
        String(hidden)
      );
    }

    function update() {
      ticking = false;

      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      const nextDirection =
        delta > 0 ? 1 : delta < 0 ? -1 : 0;

      const scrolled = y > threshold;
      header.classList.toggle('is-scrolled', scrolled);

      if (nextDirection !== 0) {
        if (nextDirection !== direction) {
          direction = nextDirection;
          distance = 0;
          menuScrollDistance = 0;
        }

        distance += Math.abs(delta);
        menuScrollDistance += Math.abs(delta);
      }

      if (
        closeOnScroll &&
        menuScrollDistance >= 12 &&
        mobileMenu()?.open
      ) {
        closeMobileMenu();
        menuScrollDistance = 0;
      }

      if (visibility === 'smart') {
        if (revealNearTop && y <= threshold) {
          setHidden(false);
          distance = 0;
        } else if (interacting()) {
          setHidden(false);
          distance = 0;
        } else if (
          direction === 1 &&
          distance >= hideDistance &&
          scrolled
        ) {
          setHidden(true);
          distance = 0;
        } else if (
          direction === -1 &&
          distance >= revealDistance
        ) {
          setHidden(false);
          distance = 0;
        }
      } else if (visibility === 'hide') {
        setHidden(scrolled && !interacting());
      } else {
        setHidden(false);
      }

      lastY = y;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    document.addEventListener('keydown', event => {
      if (
        event.key === 'Tab' ||
        event.key.startsWith('Arrow')
      ) {
        keyboardMode = true;
      }

      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    }, { signal });

    document.addEventListener('pointerdown', () => {
      keyboardMode = false;
    }, { signal });

    header.addEventListener('focusin', () => {
      if (protect && keyboardMode) {
        setHidden(false);
      }
    }, { signal });

    header.addEventListener('toggle', () => {
      if (interacting()) setHidden(false);
    }, { capture: true, signal });

    window.addEventListener(
      'scroll',
      onScroll,
      { passive: true, signal }
    );

    const section = header.closest('.shopify-section');

    section?.addEventListener(
      'shopify:section:unload',
      () => controller.abort(),
      { signal }
    );

    update();
  }

  function boot() {
    document.querySelectorAll(SELECTOR).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {
      once: true
    });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', boot);
})();
