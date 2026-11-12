(() => {
  const controllers = new WeakMap();

  function init(header) {
    controllers.get(header)?.abort();

    const controller = new AbortController();
    controllers.set(header, controller);
    const signal = controller.signal;

    const dropdowns = [
      ...header.querySelectorAll('.header__dropdown')
    ];

    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('toggle', () => {
        if (!dropdown.open) return;

        dropdowns.forEach(other => {
          if (other !== dropdown) other.open = false;
        });
      }, { signal });
    });

    document.addEventListener('pointerdown', event => {
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target)) {
          dropdown.open = false;
        }
      });
    }, { signal });

    header.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;

      dropdowns.forEach(dropdown => {
        if (dropdown.open) {
          dropdown.open = false;
          dropdown.querySelector('summary')?.focus();
        }
      });
    }, { signal });

    header.closest('.shopify-section')?.addEventListener(
      'shopify:section:unload',
      () => controller.abort(),
      { signal }
    );
  }

  function boot() {
    document.querySelectorAll('.marketplace-header')
      .forEach(init);
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
