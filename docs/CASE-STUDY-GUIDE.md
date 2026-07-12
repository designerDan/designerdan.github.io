# Adding a new case study (≤10 steps)

Use **Zix** (`zix.html`) as the reference page. Copy its structure; swap content and theme tokens only.

## Steps

1. **Duplicate** `zix.html` → `your-project.html` (or folder route if using clean URLs).

2. **Update `<head>`** — only change page-specific meta:
   - `<title>`, `<meta name="description">`, `<link rel="canonical">`
   - Open Graph / Twitter tags
   - JSON-LD `CreativeWork` block
   - Hero image `<link rel="preload">`

3. **Set body attrs:**
   ```html
   <body class="case-page" data-next-project="./next-slug">
   ```

4. **Hero section** — keep `project-hero project-hero--fold`. Set theme:
   - Default (brand pink): omit `data-accent-theme`
   - Yellow: `data-accent-theme="yellow"` + `data-nav-link-tone="dark"`
   - Brown: `data-accent-theme="brown"` + `data-nav-link-tone="light"`
   - Add `[data-hero-gallery]` wrapper if using horizontal gallery images

5. **Content sections** — reuse canonical blocks in order:
   - `text-section` → `asset-section` / `assets-duo` / `assets-trio` → `banner-showroom` → `product-showcase` → `text-blocks`
   - Each `text-section` uses the same wrapper: `cs-wrap text-section__wrap` → header → columns → headline + prose

6. **Finish block** — copy the `finish` skeleton unchanged. Set optional `data-accent-theme="yellow|brown"` for colored CTA backgrounds. Keep `data-nav-theme="paper"`.

7. **Handoff block** — copy `project-handoff` skeleton. Set `data-nav-theme="yellow|brown|brand"` for handoff + header sync. Update links, copy, and preview image.

8. **Scripts** (bottom of `<body>`, in order):
   ```html
   <script src="…/gsap.min.js"></script>
   <script src="…/ScrollTrigger.min.js"></script>
   <script src="./js/shared.js"></script>
   <script src="./js/hero-gallery.js"></script>  <!-- omit if no gallery -->
   <script src="./js/case-study.js"></script>
   ```

9. **Wire the chain** — update the *previous* case study's `data-next-project` and handoff link to point to your new page.

10. **Verify** — `npm run lint:css`, spot-check desktop/mobile/reduced-motion, test handoff scroll-to-advance at page bottom.

## Theme tokens

| Attribute | Where | Values |
|-----------|-------|--------|
| `data-accent-theme` | hero, finish | `yellow`, `brown` — drives `--surface-*` vars in `patterns.css` |
| `data-nav-theme` | handoff | `yellow`, `brown`, `brand` — drives `--handoff-*` vars in `patterns.css` |

## CSS / JS ownership

| Concern | File |
|---------|------|
| Layout, header theming | `css/layout.css` |
| **Shared rhythms, themes, proof columns** | **`css/patterns.css`** |
| Hero, finish, handoff | `css/case-study.css` |
| Text/assets/banner blocks | `css/sections.css` |
| Motion utilities | `js/shared.js` |
| Case motion + nav | `js/case-study.js` |
| Hero gallery | `js/hero-gallery.js` |
