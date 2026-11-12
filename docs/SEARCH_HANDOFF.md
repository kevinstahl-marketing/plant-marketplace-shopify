# Plant Marketplace — Search Development Handoff

Date: November 11, 2026
Branch: feat/adaptive-navigation

## Project direction

Build a premium editorial botanical marketplace on Shopify
Skeleton, with search-first discovery.

Design goals:
- Botanical journal aesthetic, not generic AI/SaaS styling.
- Global Shopify color schemes and typography settings.
- Reusable, modular Liquid components.
- Component-owned CSS and JavaScript.
- Configurable presentation: inline, dropdown, drawer, modal.
- Search should be prominent throughout the storefront.

## Completed

- Native Shopify color schemes.
- Global typography controls.
- Configurable header appearance.
- Initial reusable search component.
- Predictive search JavaScript.
- Search component CSS.
- Optional header inline-search integration.

## Current issue — FIX FIRST

The inline search is NOT visible in the Shopify preview.

Expected setting:
Header > Show inline desktop search

Investigate:
1. Is the setting visible in the Theme Editor?
2. Is the correct development theme being previewed?
3. Is sections/header.liquid the active header section?
4. Does the header render the marketplace-search snippet?
5. Is show_inline_search enabled in saved section settings?
6. Is CSS hiding it at the current viewport width?
7. Does predictive search return actual Shopify products?

Do not assume the search component works until verified.

## Architecture

snippets/marketplace-search.liquid
assets/marketplace-search.css
assets/marketplace-search.js

Search should be reusable in:
- Header
- Homepage hero
- Search results page
- Future modal or drawer

Shopify Predictive Search API is the initial backend.

Future botanical search should support:
- Species and cultivars
- Botanical synonyms
- USDA growing zones
- Seeds, plants, and fruit trees
- Product and editorial content discovery

## Next steps

1. Diagnose why header search is not visible.
2. Confirm predictive search functionality.
3. Fix accessibility and multi-instance behavior.
4. Build a search-first homepage hero.
5. Resume modular adaptive navigation explorer.
6. Polish editorial styling across the storefront.

## Development rules

- Keep components modular.
- Avoid hardcoded colors.
- Use Shopify global design tokens.
- Expose appropriate controls in Theme Editor.
- Avoid duplicated search logic.
- Work on feature branches.
- Commit at logical checkpoints.
- Run Shopify Theme Check before commits.
