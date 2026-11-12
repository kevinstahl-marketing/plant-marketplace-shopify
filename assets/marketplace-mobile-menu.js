(() => {
  const controllers = new WeakMap();

  function init(root) {
    controllers.get(root)?.abort();

    const controller = new AbortController();
    controllers.set(root, controller);

    const signal = controller.signal;
    const menus = root.querySelectorAll(
      '.marketplace-mobile-nav details'
    );

    menus.forEach((menu) => {
      // Close the menu when navigating.
      menu.querySelectorAll('a[href]').forEach((link) => {
        link.addEventListener('click', () => {
          menus.forEach((item) => {
            item.open = false;
          });
        }, { signal });
      });
    });

    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;

      const openMenus = root.querySelectorAll(
        '.marketplace-mobile-nav details[open]'
      );

      if (!openMenus.length) return;

      openMenus.forEach((menu) => {
        menu.open = false;
      });

      root.querySelector(
        '.marketplace-mobile-nav summary'
      )?.focus();
    }, { signal });

    // Close when clicking outside the mobile navigation.
    document.addEventListener('pointerdown', (event) => {
      if (
        !root.contains(event.target) ||
        !event.target.closest('.marketplace-mobile-nav')
      ) {
        menus.forEach((menu) => {
          menu.open = false;
        });
      }
    }, { signal });

    root.closest('.shopify-section')?.addEventListener(
      'shopify:section:unload',
      () => controller.abort(),
      { signal }
    );
  }

  function boot() {
    document.querySelectorAll(
      '.marketplace-header'
    ).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', boot);
})();
