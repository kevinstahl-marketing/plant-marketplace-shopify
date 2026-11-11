/**
 * Marketplace Search
 * Reusable Shopify predictive search component.
 */

if (!customElements.get('marketplace-search')) {
  customElements.define('marketplace-search', class extends HTMLElement {
    constructor() {
      super();

      this.timer = null;
      this.controller = null;
      this.activeIndex = -1;
      this.requestVersion = 0;
    }

    connectedCallback() {
      this.input = this.querySelector('.marketplace-search__input');
      this.results = this.querySelector('.marketplace-search__results');
      this.status = this.querySelector('[data-search-status]');
      this.form = this.querySelector('form');

      if (!this.input || !this.results) return;

      this.input.addEventListener('input', () => this.onInput());
      this.input.addEventListener('keydown', event => this.onKeydown(event));

      this.addEventListener('focusout', event => {
        if (!this.contains(event.relatedTarget)) this.close();
      });

      this.onDocumentPointer = event => {
        if (!this.contains(event.target)) this.close();
      };

      document.addEventListener('pointerdown', this.onDocumentPointer);
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      this.controller?.abort();
      document.removeEventListener('pointerdown', this.onDocumentPointer);
    }

    onInput() {
      clearTimeout(this.timer);
      this.controller?.abort();
      this.requestVersion++;
      this.activeIndex = -1;

      const query = this.input.value.trim();

      if (query.length < 2) {
        this.close();
        return;
      }

      this.status.textContent = 'Searching';

      this.timer = setTimeout(() => {
        this.search(query, this.requestVersion);
      }, 220);
    }

    async search(query, version) {
      this.controller = new AbortController();

      const endpoint = this.dataset.searchRoot;
      const url = new URL(endpoint, window.location.origin);

      url.searchParams.set('q', query);
      url.searchParams.set(
        'resources[type]',
        'product,collection,page,article'
      );
      url.searchParams.set('resources[limit]', '6');
      url.searchParams.set('resources[options][unavailable_products]', 'last');

      try {
        const response = await fetch(url, {
          signal: this.controller.signal,
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error('Search request failed');

        const data = await response.json();

        if (version !== this.requestVersion) return;

        this.render(data.resources?.results || {}, query);
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (version !== this.requestVersion) return;

        this.results.replaceChildren();
        this.close();
        this.status.textContent = 'Suggestions unavailable. Press Enter to search.';
      }
    }

    render(data, query) {
      this.results.replaceChildren();
      this.activeIndex = -1;

      const groups = [
        ['Products', data.products || []],
        ['Collections', data.collections || []],
        ['Articles', data.articles || []],
        ['Pages', data.pages || []]
      ];

      let count = 0;

      for (const [label, items] of groups) {
        if (!items.length) continue;

        const heading = document.createElement('div');
        heading.className = 'marketplace-search__heading';
        heading.textContent = label;
        this.results.append(heading);

        for (const item of items) {
          const link = document.createElement('a');
          link.className = 'marketplace-search__result';
          link.href = this.safeUrl(item.url);
          link.setAttribute('role', 'option');
          link.setAttribute('aria-selected', 'false');

          if (label === 'Products' && item.featured_image?.url) {
            const image = document.createElement('img');
            image.className = 'marketplace-search__result-image';
            image.src = item.featured_image.url;
            image.alt = '';
            image.loading = 'lazy';
            link.append(image);
          }

          const copy = document.createElement('span');
          copy.className = 'marketplace-search__result-copy';

          const title = document.createElement('span');
          title.className = 'marketplace-search__result-title';
          title.textContent = item.title || '';

          const meta = document.createElement('span');
          meta.className = 'marketplace-search__result-meta';
          meta.textContent = label === 'Products'
            ? (item.vendor || 'Plant Marketplace')
            : label.slice(0, -1);

          copy.append(title, meta);
          link.append(copy);
          this.results.append(link);

          count++;
        }
      }

      if (!count) {
        const empty = document.createElement('div');
        empty.className = 'marketplace-search__empty';
        empty.textContent = 'No instant matches. Try the full search.';
        this.results.append(empty);
      }

      const all = document.createElement('a');
      all.className = 'marketplace-search__all';
      all.href = `${this.form.action}?q=${encodeURIComponent(query)}`;
      all.textContent = `View all results for “${query}”`;
      this.results.append(all);

      this.open();
      this.status.textContent = `${count} suggestions available`;
    }

    safeUrl(value) {
      try {
        const url = new URL(value, window.location.origin);
        return url.origin === window.location.origin
          ? url.href
          : '#';
      } catch {
        return '#';
      }
    }

    onKeydown(event) {
      if (event.key === 'Escape') {
        this.close();
        return;
      }

      if (this.results.hidden) return;

      const options = [...this.results.querySelectorAll(
        '.marketplace-search__result'
      )];

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.activeIndex = Math.min(
          this.activeIndex + 1,
          options.length - 1
        );
        this.updateActive(options);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, -1);
        this.updateActive(options);
      }

      if (event.key === 'Enter' && this.activeIndex >= 0) {
        event.preventDefault();
        options[this.activeIndex]?.click();
      }
    }

    updateActive(options) {
      options.forEach((option, index) => {
        const active = index === this.activeIndex;
        option.setAttribute('aria-selected', String(active));
        if (active) option.scrollIntoView({ block: 'nearest' });
      });
    }

    open() {
      this.results.hidden = false;
      this.input.setAttribute('aria-expanded', 'true');
    }

    close() {
      this.results.hidden = true;
      this.input?.setAttribute('aria-expanded', 'false');
      this.activeIndex = -1;
    }
  });
}
