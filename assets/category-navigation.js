/**
 * Botanical category navigation.
 * Liquid owns the menu, CSS owns appearance, JS owns behavior.
 */
if (!customElements.get('category-navigation')) {
  customElements.define('category-navigation', class extends HTMLElement {
    connectedCallback() {
      this.drawer = this.querySelector('.category-navigation__drawer');
      this.overlay = this.querySelector('[data-category-overlay]');
      this.items = [...this.querySelectorAll('.category-navigation__item')];

      if (!this.drawer || !this.overlay) return;

      this.isOpen = false;
      this.imageRequests = new WeakMap();
      this.previousOverflow = '';
      this.lastFocus = null;

      // Preserve the original DOM locations for Shopify editor reloads.
      this.drawerParent = this.drawer.parentNode;
      this.overlayParent = this.overlay.parentNode;
      this.drawerNextSibling = this.drawer.nextSibling;
      this.overlayNextSibling = this.overlay.nextSibling;

      // Fixed layers must escape Shopify section stacking contexts.
      document.body.append(this.overlay, this.drawer);

      this.handleDocumentClick = event => {
        const open = event.target.closest('[data-category-open]');

        if (open) {
          event.preventDefault();
          this.openDrawer(open);
          return;
        }

        if (this.drawer.contains(event.target)) {
          if (event.target.closest('[data-category-close]')) {
            this.closeDrawer();
            return;
          }

          const next = event.target.closest('[data-nav-next]');
          const back = event.target.closest('[data-nav-back]');

          if (next) this.showView(next.dataset.navNext);
          if (back) this.showView(back.dataset.navBack);
        }
      };

      this.handleOverlayClick = () => this.closeDrawer();

      this.handleImageHover = event => {
        const link = event.target.closest('[data-nav-image]');
        if (!link || !this.contains(link)) return;

        this.swapFeatureImage(link);
      };

      this.handleImageFocus = event => {
        const link = event.target.closest('[data-nav-image]');
        if (!link || !this.contains(link)) return;

        this.swapFeatureImage(link);
      };

      this.handleImageLeave = event => {
        const panel = event.target.closest('.category-navigation__panel');
        if (
          panel &&
          !panel.contains(event.relatedTarget)
        ) {
          this.resetFeatureImage(panel);
        }
      };

      this.handleImageFocusOut = event => {
        const panel = event.target.closest('.category-navigation__panel');
        if (!panel) return;

        if (!panel.contains(event.relatedTarget)) {
          this.resetFeatureImage(panel);
        }
      };

      this.handleKeydown = event => {
        if (event.key === 'Escape') {
          if (this.isOpen) {
            event.preventDefault();
            this.closeDrawer();
          }
          this.closeDesktopMenus();
          return;
        }

        if (event.key !== 'Tab' || !this.isOpen) return;

        const focusable = this.getFocusable();
        if (!focusable.length) {
          event.preventDefault();
          this.drawer.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (
            document.activeElement === first ||
            !this.drawer.contains(document.activeElement)
          ) {
            event.preventDefault();
            last.focus();
          }
        } else if (
          document.activeElement === last ||
          !this.drawer.contains(document.activeElement)
        ) {
          event.preventDefault();
          first.focus();
        }
      };

      this.handleOutsidePointer = event => {
        if (!this.contains(event.target)) this.closeDesktopMenus();
      };

      this.handleResize = () => {
        if (window.innerWidth >= 750) this.closeDrawer(false);
        this.updateHeaderHeight();
      };

      this.handleDetailsToggle = event => {
        if (!event.target.open) return;

        this.items.forEach(item => {
          if (item !== event.target) item.open = false;
        });
      };

      this.handleSectionLoad = () => {
        this.observeHeader();
        this.updateHeaderHeight();
      };

      document.addEventListener('click', this.handleDocumentClick);
      document.addEventListener('keydown', this.handleKeydown);
      document.addEventListener('pointerdown', this.handleOutsidePointer);
      document.addEventListener('shopify:section:load', this.handleSectionLoad);
      window.addEventListener('resize', this.handleResize);
      this.overlay.addEventListener('click', this.handleOverlayClick);

      this.addEventListener('pointerover', this.handleImageHover);
      this.addEventListener('focusin', this.handleImageFocus);
      this.addEventListener('pointerout', this.handleImageLeave);
      this.addEventListener('focusout', this.handleImageFocusOut);

      this.items.forEach(item => {
        item.addEventListener('toggle', this.handleDetailsToggle);
      });

      this.headerObserver = new ResizeObserver(() => {
        this.updateHeaderHeight();
      });

      this.observeHeader();
    }

    disconnectedCallback() {
      this.closeDrawer(false);

      document.removeEventListener('click', this.handleDocumentClick);
      document.removeEventListener('keydown', this.handleKeydown);
      document.removeEventListener('pointerdown', this.handleOutsidePointer);
      document.removeEventListener('shopify:section:load', this.handleSectionLoad);
      window.removeEventListener('resize', this.handleResize);
      this.overlay?.removeEventListener('click', this.handleOverlayClick);

      this.removeEventListener('pointerover', this.handleImageHover);
      this.removeEventListener('focusin', this.handleImageFocus);
      this.removeEventListener('pointerout', this.handleImageLeave);
      this.removeEventListener('focusout', this.handleImageFocusOut);

      this.items?.forEach(item => {
        item.removeEventListener('toggle', this.handleDetailsToggle);
      });

      this.headerObserver?.disconnect();

      // Restore owned elements before Shopify removes the section.
      if (this.overlayParent?.isConnected) {
        this.overlayParent.insertBefore(
          this.overlay,
          this.overlayNextSibling?.parentNode === this.overlayParent
            ? this.overlayNextSibling
            : null
        );
      } else {
        this.overlay?.remove();
      }

      if (this.drawerParent?.isConnected) {
        this.drawerParent.insertBefore(
          this.drawer,
          this.drawerNextSibling?.parentNode === this.drawerParent
            ? this.drawerNextSibling
            : null
        );
      } else {
        this.drawer?.remove();
      }
    }

    observeHeader() {
      const header = document.querySelector('.site-header');
      if (this.header === header) return;

      this.headerObserver?.disconnect();
      this.header = header;

      if (header) this.headerObserver?.observe(header);
      this.updateHeaderHeight();
    }

    updateHeaderHeight() {
      const height = this.header?.getBoundingClientRect().height || 82;

      document.documentElement.style.setProperty(
        '--marketplace-sticky-header-height',
        `${height}px`
      );
    }

    swapFeatureImage(link) {
      if (this.dataset.imageSwap !== 'true') return;

      const panel = link.closest('.category-navigation__panel');
      const feature = panel?.querySelector('[data-nav-feature]');
      if (!feature || !link.dataset.navImage) return;

      this.loadFeatureImage(
        feature,
        link.dataset.navImage,
        link.dataset.navImageAlt || ''
      );
    }

    resetFeatureImage(panel) {
      const feature = panel.querySelector('[data-nav-feature]');
      if (!feature) return;

      this.loadFeatureImage(
        feature,
        feature.dataset.defaultImage,
        feature.dataset.defaultAlt || ''
      );
    }

    loadFeatureImage(feature, src, alt) {
      const image = feature.querySelector('img');
      if (!image || !src) return;

      // A newer hover invalidates any pending image load.
      const request = (this.imageRequests.get(feature) || 0) + 1;
      this.imageRequests.set(feature, request);

      if (image.dataset.activeImage === src) return;

      const preload = new Image();

      preload.onload = () => {
        if (this.imageRequests.get(feature) !== request) return;
        if (!feature.isConnected) return;

        image.removeAttribute('srcset');
        image.removeAttribute('sizes');
        image.src = src;
        image.alt = alt;
        image.dataset.activeImage = src;

        image.classList.remove('is-revealing');
        void image.offsetWidth;
        image.classList.add('is-revealing');
      };

      preload.onerror = () => {
        // Keep the existing image if the replacement fails.
      };

      preload.src = src;
    }

    closeDesktopMenus() {
      this.items?.forEach(item => {
        item.open = false;
      });
    }

    getFocusable() {
      return [...this.drawer.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter(element => {
        return !element.closest('[hidden]') &&
          !element.inert &&
          element.getClientRects().length > 0;
      });
    }

    openDrawer(trigger) {
      if (window.innerWidth >= 750 || this.isOpen) return;

      this.closeDesktopMenus();

      this.lastFocus = trigger;
      this.previousOverflow = document.documentElement.style.overflow;
      this.isOpen = true;

      this.showView('root', false);

      this.drawer.inert = false;
      this.drawer.setAttribute('aria-hidden', 'false');
      this.drawer.classList.add('is-open');
      this.overlay.hidden = false;

      trigger.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';

      this.drawer.querySelector('[data-category-close]')?.focus();
    }

    closeDrawer(restoreFocus = true) {
      if (!this.isOpen) return;

      this.isOpen = false;

      // Move focus out before making the dialog inert.
      if (restoreFocus && this.lastFocus?.isConnected) {
        this.lastFocus.focus();
      } else if (this.drawer.contains(document.activeElement)) {
        document.activeElement.blur();
      }

      this.drawer.classList.remove('is-open');
      this.drawer.inert = true;
      this.drawer.setAttribute('aria-hidden', 'true');
      this.overlay.hidden = true;

      document.querySelectorAll('[data-category-open]').forEach(button => {
        button.setAttribute('aria-expanded', 'false');
      });

      document.documentElement.style.overflow = this.previousOverflow;
    }

    showView(name, focus = true) {
      const views = [...this.drawer.querySelectorAll('[data-nav-view]')];
      const target = views.find(view => view.dataset.navView === name);
      if (!target) return;

      views.forEach(view => {
        const active = view === target;
        view.hidden = !active;
        view.classList.toggle('is-active', active);
      });

      const body = this.drawer.querySelector('.category-navigation__drawer-body');
      if (body) body.scrollTop = 0;

      if (focus && this.isOpen) {
        target.querySelector('button, a')?.focus();
      }
    }
  });
}
