# Untied storefront

Static e-commerce site for Untied (handprinted bandanas). No build tools needed.

- `index.html` – page shell (header, cart drawer, search, footer)
- `assets/css/style.css` – all styling; brand colours and fonts are the CSS variables at the top
- `assets/js/halftone.js` – animated halftone dot renderer for the brand marks (hero, loader, story)
- `assets/fonts/dune-rise.woff2` – Dune Rise display font, extracted from the brand book PDF (uppercase only; confirm licence with Fontswan)
- `assets/img/` – wordmark, symbol, halftone comet and the star cursor; `assets/img/products/` holds the four Untied Universe scarf photos
- `assets/js/patterns.js` – draws each print as an SVG bandana (used only for products without a photo)
- `assets/js/app.js` – routing (#shop, #p-<id>, #story, #checkout…), cart in localStorage, animations
- `data/products.json` – the Untied Universe products and prices (prices are placeholders). Add `"image": "assets/img/your-photo.jpg"` to a product to use a real photo
- `build.py` – bundles everything into `dist/untied.html` (one file, used for the hosted preview)

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
The site opens in dark mode; the header toggle switches to light mode (colours under `:root[data-theme="light"]` in style.css).
Checkout is a demo (no payments). Newsletter sign-ups are saved in the browser only.
