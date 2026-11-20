(() => {
  if (window.__plantMarketplaceQuickAdd) return;
  window.__plantMarketplaceQuickAdd = true;

  const root = window.Shopify?.routes?.root || '/';

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-link]').forEach(link => {
      link.setAttribute(
        'aria-label',
        `Cart, ${count} ${count === 1 ? 'item' : 'items'}`
      );

      let badge = link.querySelector('[data-cart-count]');

      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'header__cart-count';
          badge.dataset.cartCount = '';
          link.appendChild(badge);
        }
        badge.textContent = count;
      } else {
        badge?.remove();
      }
    });
  }

  document.addEventListener('submit', async event => {
    const form = event.target.closest?.('[data-product-quick-add]');
    if (!form) return;

    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    const label = form.querySelector('[data-quick-add-label]');
    const feedback = form.querySelector('[data-quick-add-feedback]');

    if (!button || button.disabled) return;

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    label.textContent = 'Adding…';
    feedback.hidden = true;
    feedback.textContent = '';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
          Accept: 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.description || result.message || 'Unable to add this item.');
      }

      const cartResponse = await fetch(root + 'cart.js', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });

      if (!cartResponse.ok) {
        throw new Error('Item added, but the cart count could not refresh.');
      }

      const cart = await cartResponse.json();
      updateCartCount(cart.item_count);

      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { cart }
      }));

      label.textContent = 'Added ✓';
      feedback.textContent = 'Added to your cart.';
      feedback.hidden = false;

      // Dismiss successful add feedback automatically.
      const successMessage = feedback.textContent;
      window.setTimeout(() => {
        if (feedback.textContent === successMessage) {
          feedback.hidden = true;
          feedback.textContent = '';
          label.textContent = 'Add to cart';
        }
      }, 2500);
    } catch (error) {
      label.textContent = 'Add to cart';
      feedback.textContent = error.message || 'Something went wrong.';
      feedback.hidden = false;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
})();
