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
      const thumbnails = gallery.querySelectorAll('[data-gallery-thumbnail]');

      thumbnails.forEach(button => {
        button.addEventListener('click', () => {
          const target = document.getElementById(button.dataset.target);
          if (!target) return;

          viewport.scrollTo({
            left: target.offsetLeft - viewport.offsetLeft,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'auto'
              : 'smooth'
          });

          thumbnails.forEach(item => {
            item.setAttribute('aria-current', String(item === button));
          });
        });
      });
    }

    const select = root.querySelector('[data-product-variant-select]');
    const hiddenId = root.querySelector('[data-product-variant-id]');
    const variantsJson = root.querySelector('[data-product-variants]');
    const price = root.querySelector('[data-product-price]');
    const comparePrice = root.querySelector('[data-product-compare-price]');
    const addButton = root.querySelector('[data-product-add]');
    const addLabel = root.querySelector('[data-product-add-label]');

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

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    };

    select?.addEventListener('change', event => {
      updateVariant(event.target.value);
    });
  }

  function initializeAll(scope = document) {
    if (scope.matches?.('[data-product-page]')) initialize(scope);
    scope.querySelectorAll('[data-product-page]').forEach(initialize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeAll());
  } else {
    initializeAll();
  }

  document.addEventListener('shopify:section:load', event => {
    initializeAll(event.target);
  });
})();
