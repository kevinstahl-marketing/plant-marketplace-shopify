(() => {
  if (window.__marketplaceRelatedProducts) return;
  window.__marketplaceRelatedProducts = true;

  const selector =
    '[data-related-products-url]:not([data-related-products-loaded])';

  async function load(root) {
    if (root.dataset.relatedProductsLoading === 'true') return;

    const url = root.dataset.relatedProductsUrl;
    if (!url) return;

    root.dataset.relatedProductsLoading = 'true';

    try {
      const response = await fetch(url, {
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Recommendations request failed: ${response.status}`);
      }

      const html = await response.text();
      const documentFragment = new DOMParser().parseFromString(
        html,
        'text/html'
      );

      const incoming = documentFragment.querySelector(
        `#${CSS.escape(root.id)}`
      );

      if (!incoming) {
        throw new Error('Recommendations section missing from response');
      }

      if (!root.isConnected) return;

      root.innerHTML = incoming.innerHTML;
      root.hidden = incoming.hidden;
      root.dataset.relatedProductsLoaded = 'true';

      // Refresh the shared carousel after async content replacement.
      window.MarketplaceCarousel?.refresh(root);
    } catch (error) {
      console.warn('[Related products]', error);
      delete root.dataset.relatedProductsLoading;
    }
  }

  function initialize(scope = document) {
    if (scope.matches?.(selector)) load(scope);
    scope.querySelectorAll(selector).forEach(load);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initialize());
  } else {
    initialize();
  }

  document.addEventListener('shopify:section:load', event => {
    initialize(event.target);
  });
})();
