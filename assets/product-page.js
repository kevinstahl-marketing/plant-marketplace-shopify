(() => {
  if (window.__marketplaceProductPage) return;
  window.__marketplaceProductPage = true;

  const instances = new WeakSet();

  function initialize(root) {
    if (instances.has(root)) return;
    instances.add(root);

    const gallery = root.querySelector('[data-product-gallery]');
    const viewport = gallery?.querySelector('[data-gallery-viewport]');

    if (gallery && viewport) {
      const slides = Array.from(gallery.querySelectorAll('[data-gallery-slide]'));
      const thumbnails = Array.from(gallery.querySelectorAll('[data-gallery-thumbnail]'));
      const dots = Array.from(gallery.querySelectorAll('[data-gallery-dot]'));
      const previous = gallery.querySelector('[data-gallery-prev]');
      const next = gallery.querySelector('[data-gallery-next]');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

      let activeIndex = 0;
      let targetIndex = null;
      let scrollTimer = null;

      const setActive = index => {
        activeIndex = Math.max(0, Math.min(index, slides.length - 1));

        thumbnails.forEach((item, i) => {
          item.setAttribute('aria-current', String(i === activeIndex));
        });

        dots.forEach((item, i) => {
          item.setAttribute('aria-current', String(i === activeIndex));
        });

        if (previous) previous.disabled = activeIndex === 0;
        if (next) next.disabled = activeIndex === slides.length - 1;
      };

      const nearestIndex = () => {
        let nearest = 0;
        let distance = Infinity;

        slides.forEach((slide, index) => {
          const offset = slide.offsetLeft - viewport.offsetLeft;
          const difference = Math.abs(offset - viewport.scrollLeft);

          if (difference < distance) {
            distance = difference;
            nearest = index;
          }
        });

        return nearest;
      };

      const settle = () => {
        clearTimeout(scrollTimer);
        scrollTimer = null;
        targetIndex = null;
        if (slides.length) setActive(nearestIndex());
      };

      const goTo = index => {
        if (index < 0 || index >= slides.length) return;

        targetIndex = index;
        setActive(index);

        viewport.scrollTo({
          left: slides[index].offsetLeft - viewport.offsetLeft,
          behavior: reducedMotion.matches ? 'auto' : 'smooth'
        });

        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(settle, reducedMotion.matches ? 0 : 650);
      };

      thumbnails.forEach((item, index) => {
        item.addEventListener('click', () => goTo(index));
      });

      dots.forEach((item, index) => {
        item.addEventListener('click', () => goTo(index));
      });

      previous?.addEventListener('click', () => {
        goTo((targetIndex ?? activeIndex) - 1);
      });

      next?.addEventListener('click', () => {
        goTo((targetIndex ?? activeIndex) + 1);
      });

      viewport.addEventListener('scroll', () => {
        if (targetIndex !== null) return;

        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(settle, 130);
      }, { passive: true });

      if ('onscrollend' in viewport) {
        viewport.addEventListener('scrollend', settle);
      }

      if (slides.length) setActive(0);
    }

    const select = root.querySelector('[data-product-variant-select]');
    const hiddenId = root.querySelector('[data-product-variant-id]');
    const variantsJson = root.querySelector('[data-product-variants]');
    const price = root.querySelector('[data-product-price]');
    const comparePrice = root.querySelector('[data-product-compare-price]');
    const addButton = root.querySelector('[data-product-add]');
    const addLabel = root.querySelector('[data-product-add-label]');
    const inventory = root.querySelector('[data-product-inventory]');

    if (!variantsJson || !hiddenId) return;

    let variants;

    try {
      variants = JSON.parse(variantsJson.textContent);
    } catch {
      return;
    }

    const currency = document.documentElement.dataset.currency || 'USD';
    const locale = document.documentElement.lang || 'en-US';

    const formatMoney = cents => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(cents / 100);
    };

    const updateVariant = id => {
      const variant = variants.find(item => String(item.id) === String(id));
      if (!variant) return;

      hiddenId.value = variant.id;

      if (price) price.textContent = formatMoney(variant.price);

      if (comparePrice) {
        const hasCompare = variant.compare_at_price > variant.price;
        comparePrice.hidden = !hasCompare;
        if (hasCompare) {
          comparePrice.textContent = formatMoney(variant.compare_at_price);
        }
      }

      if (addButton) addButton.disabled = !variant.available;

      if (addLabel) {
        addLabel.textContent = variant.available ? 'Add to cart' : 'Sold out';
      }

      if (inventory) {
        inventory.textContent = variant.available ? 'In stock' : 'Sold out';
      }

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    };

    select?.addEventListener('change', event => {
      updateVariant(event.target.value);
    });
  }


  // Product information sticks only when it fits comfortably in the viewport.
  const stickyInstances = new WeakMap();

  function initializeStickyInformation(root) {
    if (stickyInstances.has(root)) return;

    const info = root.querySelector(
      '.product-page__information--sticky'
    );
    if (!info) return;

    const header = document.querySelector('header');
    const margin = 16;
    let frame = 0;

    const measure = () => {
      frame = 0;
      if (!root.isConnected) return;

      let headerBottom = 0;

      if (header) {
        const style = getComputedStyle(header);

        if (style.position === 'sticky' ||
            style.position === 'fixed') {
          const bounds = header.getBoundingClientRect();

          // Only reserve space for a header occupying the top viewport edge.
          if (bounds.top <= margin && bounds.bottom > 0) {
            headerBottom = bounds.bottom;
          }
        }
      }

      const offset = Math.max(margin, headerBottom + margin);

      root.style.setProperty(
        '--product-sticky-top',
        `${Math.ceil(offset)}px`
      );

      const desktop = window.matchMedia('(min-width: 750px)').matches;
      const fits = info.scrollHeight + offset + margin <= window.innerHeight;

      info.dataset.stickyDisabled = String(!desktop || !fits);
    };

    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(info);
    if (header) observer.observe(header);

    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true });

    stickyInstances.set(root, () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      if (frame) cancelAnimationFrame(frame);
      stickyInstances.delete(root);
    });

    schedule();
  }

  function initializeAll(scope = document) {
    if (scope.matches?.('[data-product-page]')) initialize(scope);
    scope.querySelectorAll('[data-product-page]').forEach(initialize);

    if (scope.matches?.('[data-product-page]')) {
      initializeStickyInformation(scope);
    }

    scope.querySelectorAll('[data-product-page]').forEach(
      initializeStickyInformation
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeAll());
  } else {
    initializeAll();
  }

  document.addEventListener('shopify:section:load', event => {
    initializeAll(event.target);
  });

  document.addEventListener('shopify:section:unload', event => {
    const scope = event.target;
    const roots = [
      ...(scope.matches?.('[data-product-page]') ? [scope] : []),
      ...scope.querySelectorAll('[data-product-page]')
    ];

    roots.forEach(root => stickyInstances.get(root)?.());
  });
})();
