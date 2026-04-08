# Luxury UX/UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Ibag Couture from a functional e-commerce site into a premium luxury African fashion brand experience, matching the visual quality of Dior/Zara/Farfetch.

**Architecture:** Pure frontend redesign — modify CSS variables, component markup, and Tailwind classes. No backend, API, or logic changes. New color palette (#0D0D0D / #F5F5F5 / #C9A45C) applied across all public-facing pages. 3 new files created (CartToast, 404 page, page loader). All existing functionality preserved.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Playfair Display / Geist / Cormorant Garamond fonts

**Spec:** `docs/superpowers/specs/2026-04-08-luxury-ux-redesign-design.md`

---

### Task 1: Design System — globals.css Color Palette & Utilities

**Files:**
- Modify: `client/src/app/globals.css`

This is the foundation task. Every subsequent task depends on these CSS variables and utility classes.

- [ ] **Step 1: Replace color variables in `:root`**

In `client/src/app/globals.css`, replace the existing `:root` CSS variables block (lines 3-27) with the new luxury palette:

```css
:root {
  --background: #F5F5F5;
  --foreground: #0D0D0D;
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-serif: var(--font-playfair), Georgia, serif;
  --font-serif-alt: var(--font-cormorant), Georgia, serif;
  --font-mono: var(--font-geist-mono), monospace;

  /* Luxury palette */
  --color-black: #0D0D0D;
  --color-white: #F5F5F5;
  --color-gold: #C9A45C;
  --color-gold-light: rgba(201, 164, 92, 0.12);
  --color-gold-dark: #A67C3D;
  --color-gray-100: #E8E4E0;
  --color-gray-200: #D4CFC9;
  --color-gray-400: #999999;
  --color-gray-600: #666666;
  --color-success: #22C55E;
  --color-promo: #DC2626;

  /* Legacy gold scale — keep for backwards compat */
  --gold-50: #fefce8;
  --gold-100: #fef9c3;
  --gold-200: #fef08a;
  --gold-300: #fde047;
  --gold-400: #facc15;
  --gold-500: #eab308;
  --gold-600: #C9A45C;
  --gold-700: #A67C3D;
  --gold-800: #854d0e;
  --gold-900: #713f12;
}
```

- [ ] **Step 2: Update dark mode variables**

Replace the dark mode block (around lines 30-35):

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0D0D0D;
    --foreground: #F5F5F5;
  }
}
```

- [ ] **Step 3: Add new utility classes for the luxury design system**

Add these new utility classes after the existing utility section (after line ~287):

```css
/* Luxury design system utilities */
.text-luxury-gold {
  color: var(--color-gold);
}

.bg-luxury-black {
  background-color: var(--color-black);
}

.bg-luxury-white {
  background-color: var(--color-white);
}

.border-luxury-gold {
  border-color: var(--color-gold);
}

/* Gold label style — used for section labels */
.label-gold {
  font-size: 9px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-gold);
}

/* Premium button base */
.btn-luxury-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background-color: var(--color-black);
  color: white;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-luxury-primary:hover {
  background-color: #1a1a1a;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.btn-luxury-gold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background-color: var(--color-gold);
  color: var(--color-black);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-luxury-gold:hover {
  background-color: var(--color-gold-dark);
  box-shadow: 0 10px 30px rgba(201, 164, 92, 0.25);
}

.btn-luxury-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-luxury-outline:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background-color: rgba(255, 255, 255, 0.1);
}

/* Toast animation */
@keyframes slideInFromRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutToRight {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

.animate-toast-in {
  animation: slideInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-toast-out {
  animation: slideOutToRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Page loader bar */
@keyframes pageLoaderProgress {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

.animate-page-loader {
  animation: pageLoaderProgress 1.5s ease-in-out;
}

/* Image crossfade for card hover */
.card-image-hover .card-image-secondary {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.card-image-hover:hover .card-image-secondary {
  opacity: 1;
}

.card-image-hover:hover .card-image-primary {
  opacity: 0;
}
```

- [ ] **Step 4: Verify build passes**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: Build succeeds with no CSS errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/app/globals.css
git commit -m "feat(design-system): new luxury color palette and utility classes"
```

---

### Task 2: Header — Centered Logo, Gold Accents, Modern Icons

**Files:**
- Modify: `client/src/components/Header.tsx`

- [ ] **Step 1: Update the announcement bar colors**

In `Header.tsx`, find the announcement bar section (around line 83-111). Replace the announcement bar JSX. Change:
- `bg-stone-900` → `bg-[#0D0D0D]`
- `text-stone-300` → `text-white/80`
- Add gold accent to key delivery text: wrap "Livraison" keyword with `<span className="text-[#C9A45C]">`

- [ ] **Step 2: Update desktop navigation row**

Find the desktop nav row (around lines 113-144). Update:
- Link classes from `text-stone-600 hover:text-stone-900` → `text-[#666] text-[11px] uppercase tracking-[0.15em] hover:text-[#C9A45C] transition-colors duration-300`
- Remove border classes and use `border-b border-black/[0.06]`

- [ ] **Step 3: Update main header row — center logo, modernize icons**

Find the main header row (around lines 146-287). Update:
- Header height from `h-20 md:h-24 lg:h-28` → `h-16 md:h-20`
- Background: keep `bg-white`
- Logo section (center column): ensure Playfair Display, add `tracking-[0.1em]`
- Cart badge: change from `bg-stone-900 text-white` → `bg-[#C9A45C] text-[#0D0D0D] font-semibold`
- Icon hover states: add `hover:text-[#C9A45C] transition-colors duration-300`
- Add `border-b border-black/[0.06]` to the header container

- [ ] **Step 4: Update mobile menu colors**

Find the mobile menu section (around lines 289-396). Update:
- Menu background: keep white
- Link styles: `text-[#0D0D0D]`, hover add gold underline
- Category buttons: pill-style `rounded-full` with `bg-[#0D0D0D] text-white` active state
- Increase touch targets to min `py-3` for all links

- [ ] **Step 5: Update sticky header scroll behavior**

Ensure `isScrolled` state applies `shadow-[0_1px_3px_rgba(0,0,0,0.08)]` instead of the current heavier shadow. This creates a more subtle premium feel.

- [ ] **Step 6: Verify header renders correctly**

Run: `cd client && npm run dev`
Check: Navigate to http://localhost:3000 and verify:
- Logo is centered
- Cart badge is gold
- Announcement bar is black with gold accents
- Mobile menu works (responsive test)

- [ ] **Step 7: Commit**

```bash
git add client/src/components/Header.tsx
git commit -m "feat(header): centered logo, gold accents, premium styling"
```

---

### Task 3: Footer — Dark Premium Theme

**Files:**
- Modify: `client/src/components/Footer.tsx`

- [ ] **Step 1: Update the full footer variant**

In `Footer.tsx`, update the full variant (lines 8-137):
- Container: `bg-stone-900` → `bg-[#0D0D0D]`
- Section titles: add `text-[#C9A45C] text-[10px] uppercase tracking-[0.2em] mb-4` as label above each heading
- Body text: `text-stone-400` → `text-white/60`
- Heading text: `text-white font-luxury`
- Link hover: `hover:text-white` → `hover:text-[#C9A45C] transition-colors duration-300`
- WhatsApp link: highlight with `text-[#C9A45C]`
- Social icons: `text-white/60 hover:text-[#C9A45C]`
- Bottom bar border: `border-stone-800` → `border-white/10`
- Copyright text: `text-white/40`

- [ ] **Step 2: Update the compact footer variant**

Update the compact variant (lines 139-185):
- Same color scheme as full variant
- `bg-[#0D0D0D]` background
- Links: `text-white/60 hover:text-[#C9A45C]`
- Social icons same treatment

- [ ] **Step 3: Verify both footer variants**

Run dev server, check:
- Homepage (compact footer)
- Product page (full footer)
- Both should be #0D0D0D with gold accents

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Footer.tsx
git commit -m "feat(footer): dark premium theme with gold accents"
```

---

### Task 4: Product Card — Minimaliste Luxe with Image Hover

**Files:**
- Modify: `client/src/components/ProductCardActions.tsx`

This is the shared card component used on homepage, collections, and similar products. The redesign converts it from a button-action card to a clean link-only minimaliste luxe card.

Note: ProductCardActions currently only renders an "Add to cart" button. The actual card layout is rendered inline in `page.tsx` and `collections/page.tsx`. The card markup changes will happen in Tasks 7 and 8 (homepage and collections). This task updates ProductCardActions to match the new style.

- [ ] **Step 1: Update ProductCardActions button styling**

Replace the button JSX in `ProductCardActions.tsx` (lines 34-61). Change from `bg-stone-900 text-white` to match the new palette:
- Not added: `bg-[#0D0D0D] text-white hover:bg-[#1a1a1a] text-[11px] uppercase tracking-[0.1em]`
- Added: `bg-emerald-50 text-emerald-700 border border-emerald-200` (keep as-is, it works)
- Round the corners with `rounded-sm`

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ProductCardActions.tsx
git commit -m "feat(product-card): update button styling for luxury palette"
```

---

### Task 5: Category Filter — Pill Style

**Files:**
- Modify: `client/src/components/CategoryFilter.tsx`

- [ ] **Step 1: Update filter button styles**

In `CategoryFilter.tsx`, find the button render section (around lines 32-53). Update:
- Container: keep `flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide` and add `px-1`
- Active button: `bg-stone-900 text-white` → `bg-[#0D0D0D] text-white rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.1em] font-medium`
- Inactive button: `bg-stone-100 text-stone-600 hover:bg-stone-200` → `border border-[#E8E4E0] text-[#999] rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.1em] hover:border-[#C9A45C] hover:text-[#C9A45C] transition-all duration-300`
- Add `transition-all duration-300` to all buttons for smooth state changes

- [ ] **Step 2: Commit**

```bash
git add client/src/components/CategoryFilter.tsx
git commit -m "feat(filters): pill-style category filters with gold hover"
```

---

### Task 6: Product Gallery — Vertical Thumbnails

**Files:**
- Modify: `client/src/components/ProductGallery.tsx`

- [ ] **Step 1: Convert horizontal thumbnails to vertical strip**

In `ProductGallery.tsx`, restructure the layout. Currently thumbnails are `grid grid-cols-4` below the main image (line 110). Change to a flex row with:
- Outer container: `flex gap-3` (thumbnails on left, main image on right)
- Thumbnail strip: `hidden md:flex flex-col gap-2 w-[60px]` — vertical column, hidden on mobile
- Active thumbnail: `ring-2 ring-stone-900 ring-offset-2` → `border-2 border-[#C9A45C]`
- Inactive thumbnail: `border-2 border-transparent hover:border-[#E8E4E0]`
- Main image container: `flex-1`
- Mobile: keep current horizontal thumbnails below image with `md:hidden grid grid-cols-4 gap-2`

- [ ] **Step 2: Update category badge styling**

Find the category badge (around lines 74-78). Change:
- `bg-stone-900 text-white` → `bg-[#0D0D0D] text-[#C9A45C]`
- Font: keep `text-[10px] md:text-xs tracking-[0.2em] uppercase`

- [ ] **Step 3: Update navigation arrows**

Find prev/next buttons (around lines 81-98). Change:
- `bg-white/80 backdrop-blur-sm` → `bg-white/90 backdrop-blur-sm hover:bg-white`
- Add `shadow-sm` and `transition-all duration-300`

- [ ] **Step 4: Verify gallery layout**

Run dev server, navigate to any product page, verify:
- Desktop: vertical thumbnails on left, main image on right
- Mobile: thumbnails below image in horizontal grid
- Active thumbnail has gold border
- Navigation arrows work

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ProductGallery.tsx
git commit -m "feat(gallery): vertical thumbnail strip with gold active state"
```

---

### Task 7: Homepage — Hero, Sections, Values, CTA

**Files:**
- Modify: `client/src/app/page.tsx`
- Modify: `client/src/components/HeroDynamicGallery.tsx`

This is the largest task. The homepage gets a complete visual overhaul while keeping all existing data fetching and logic.

- [ ] **Step 1: Update HeroDynamicGallery overlay gradients**

In `HeroDynamicGallery.tsx`, find the overlay divs (around lines 141-147). Replace the 3 overlays with a single stronger bottom gradient:

```tsx
{/* Dark gradient — stronger at bottom for text readability */}
<div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
```

Remove the other 2 overlay divs. Keep everything else (slides, indicators) as-is.

- [ ] **Step 2: Update slide indicators styling**

Find the indicators (around lines 150-173). Update:
- Active indicator: `bg-white` → `bg-[#C9A45C]`
- Inactive: `bg-white/40` → `bg-white/30`
- Keep the width animation (active = `w-6`, inactive = `w-2`)

- [ ] **Step 3: Restructure hero section in page.tsx**

In `page.tsx`, find the hero section (around lines 138-168). Replace the centered text overlay with bottom-left aligned text and 2 CTA buttons:

```tsx
{/* Hero Section */}
<section className="relative min-h-[75vh] md:min-h-[90vh] flex items-end">
  <HeroDynamicGallery images={heroImages} />
  <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-10 pb-16 md:pb-24">
    <p className="label-gold mb-4">IBAG COUTURE — DAKAR</p>
    <h1 className="font-luxury text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-light leading-[1.1] mb-6">
      L&apos;élégance africaine,<br />
      <em>redéfinie</em>
    </h1>
    <div className="flex flex-wrap gap-4">
      <Link href="/collections" className="btn-luxury-gold">
        Découvrir la collection
      </Link>
      <Link href="/collections?category=traditionnel" className="btn-luxury-outline">
        Sur-mesure
      </Link>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Update featured products section**

Find the featured products section (around lines 171-305). Update:
- Section padding: `py-16 md:py-24 lg:py-32` → `py-20 md:py-28 lg:py-36`
- Background: `bg-white` → `bg-[#F5F5F5]`
- Title block: replace with gold label pattern:

```tsx
<div className="text-center mb-12 md:mb-16">
  <p className="label-gold mb-3">NOS CRÉATIONS</p>
  <h2 className="font-luxury text-3xl md:text-4xl text-[#0D0D0D]">
    Créations Phares
  </h2>
</div>
```

- Product cards in the grid: update to minimaliste luxe style. Each card:

```tsx
<Link
  href={`/produits/${product.slug}`}
  key={product._id}
  className="group"
>
  <div className="relative aspect-[4/5] rounded-md overflow-hidden bg-[#E8E4E0] mb-3">
    {product.mainImage && (
      <img
        src={getFullImageUrl(product.mainImage)}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
    )}
    {/* Second image on hover */}
    {product.images?.[0] && (
      <img
        src={getFullImageUrl(product.images[0])}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"
        loading="lazy"
      />
    )}
    {/* Badges */}
    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
      {isNew(product) && (
        <span className="bg-[#0D0D0D] text-[#C9A45C] text-[8px] md:text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
          Nouveau
        </span>
      )}
      {product.promoPrice && product.promoPrice < product.basePrice && (
        <span className="bg-[#C9A45C] text-white text-[8px] md:text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
          -{Math.round((1 - product.promoPrice / product.basePrice) * 100)}%
        </span>
      )}
      {product.stockQuantity > 0 && product.stockQuantity < 3 && (
        <span className="bg-[#D97706] text-white text-[8px] md:text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
          Dernières pièces
        </span>
      )}
    </div>
  </div>
  <p className="text-[#C9A45C] text-[9px] uppercase tracking-[0.15em] mb-1">
    {product.category}
  </p>
  <h3 className="font-luxury text-sm md:text-[15px] text-[#0D0D0D] truncate mb-1">
    {product.name}
  </h3>
  <div className="flex items-center gap-2">
    <span className="text-[15px] font-semibold text-[#0D0D0D]">
      {(product.promoPrice || product.basePrice).toLocaleString("fr-FR")} F
    </span>
    {product.promoPrice && product.promoPrice < product.basePrice && (
      <span className="text-xs text-[#999] line-through">
        {product.basePrice.toLocaleString("fr-FR")} F
      </span>
    )}
  </div>
</Link>
```

Note: Remove the `ProductCardActions` button from the homepage cards. The entire card is now a link. The `isNew()` helper can check if product was created in last 14 days or simply always show for first N products.

- [ ] **Step 5: Add Values / Trust section**

After the featured products section, add a new trust values section:

```tsx
{/* Values / Trust Section */}
<section className="py-16 md:py-20 bg-[#0D0D0D]">
  <div className="max-w-7xl mx-auto px-6 md:px-10">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-white/10">
      {[
        {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21.75a1.125 1.125 0 001.125-1.125v-2.25A1.125 1.125 0 0021 12h-3.75m-6.75 0V6.375a1.125 1.125 0 011.125-1.125h3.068a1.125 1.125 0 01.796.33l2.932 2.932a1.125 1.125 0 01.33.796V12m-6.75 0h6.75" />
            </svg>
          ),
          title: "Livraison rapide",
          desc: "24–72h à Dakar et environs",
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          ),
          title: "Qualité premium",
          desc: "Tissus sélectionnés, couture artisanale",
        },
        {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          ),
          title: "Paiement sécurisé",
          desc: "Vos données protégées",
        },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center md:px-8">
          <div className="text-[#C9A45C] mb-4">{item.icon}</div>
          <h3 className="text-white text-sm font-medium tracking-wide mb-2">{item.title}</h3>
          <p className="text-white/50 text-xs">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 6: Update categories section**

Find the categories section (around lines 308-352). Update:
- Background: `bg-stone-50` → `bg-white`
- Title block: use gold label pattern (`label-gold` + Playfair heading)
- Category cards: replace circular images with rectangular cards, `aspect-[3/4]` with overlay text
- Text on hover: `text-[#C9A45C]`

- [ ] **Step 7: Replace "Why Ibag Couture" and "Our Story" sections with CTA banner**

Remove or replace the "Pourquoi Ibag Couture?" (lines 355-403) and "Notre Histoire" (lines 406-455) sections with a single clean CTA banner:

```tsx
{/* CTA Banner */}
<section className="py-20 md:py-28 bg-[#0D0D0D]">
  <div className="max-w-4xl mx-auto px-6 md:px-10 text-center">
    <div className="w-12 h-[1px] bg-[#C9A45C] mx-auto mb-8" />
    <h2 className="font-luxury text-3xl md:text-4xl lg:text-5xl text-white mb-4">
      Commandez votre style aujourd&apos;hui
    </h2>
    <p className="text-white/50 text-sm md:text-base mb-10 max-w-2xl mx-auto">
      Créations sur-mesure et prêt-à-porter de luxe africain
    </p>
    <Link href="/collections" className="btn-luxury-gold">
      Voir la collection
    </Link>
    <div className="w-12 h-[1px] bg-[#C9A45C] mx-auto mt-8" />
  </div>
</section>
```

- [ ] **Step 8: Update trust badges section**

Find the trust badges section (around lines 458-487). Update:
- `bg-stone-900` → already black, ensure `bg-[#0D0D0D]`
- Icon colors: `text-stone-200` → `text-[#C9A45C]`
- Text: `hover:text-white` → `text-white/60`

- [ ] **Step 9: Verify homepage**

Run dev server, check http://localhost:3000:
- Hero: text bottom-left, 2 CTA buttons, slideshow working
- Featured products: gold labels, minimaliste cards, image hover effect
- Values section: 3 columns, black bg, gold icons
- CTA banner: centered text, gold ornament lines
- Footer: dark theme

- [ ] **Step 10: Commit**

```bash
git add client/src/app/page.tsx client/src/components/HeroDynamicGallery.tsx
git commit -m "feat(homepage): luxury redesign — hero, cards, values, CTA sections"
```

---

### Task 8: Collections Page — Header, Filters, Grid

**Files:**
- Modify: `client/src/app/collections/page.tsx`

- [ ] **Step 1: Update page header**

Find the hero title section (around lines 118-129). Replace with:

```tsx
<div className="pt-10 md:pt-16 pb-6 md:pb-10 bg-white text-center">
  <div className="max-w-7xl mx-auto px-6 md:px-10">
    <p className="label-gold mb-3">IBAG COUTURE</p>
    <h1 className="font-luxury text-3xl md:text-4xl lg:text-5xl text-[#0D0D0D] mb-2">
      Nos Collections
    </h1>
    <p className="text-[#999] text-sm">
      {total} création{total > 1 ? "s" : ""}
    </p>
  </div>
</div>
```

- [ ] **Step 2: Update breadcrumb styling**

Find breadcrumb (around lines 104-115). Change:
- `text-stone-400` → `text-[#999]`
- `hover:text-stone-900` → `hover:text-[#C9A45C]`
- Active breadcrumb: `text-[#0D0D0D]`

- [ ] **Step 3: Update filter bar**

Find the sticky filter bar (around lines 134-146). Update:
- `bg-white/95` → `bg-white/95 backdrop-blur-sm`
- `sticky top-20 md:top-24 lg:top-28` → `sticky top-16 md:top-20` (matches new header height)
- Add `border-b border-black/[0.06]`

- [ ] **Step 4: Update product cards in grid to minimaliste luxe style**

Find the product article/cards in the grid (around lines 202-311). Replace each card with the same minimaliste luxe pattern from Task 7 Step 4. Key changes:
- Wrap entire card in `<Link>` instead of `<article>`
- Remove `ProductCardActions` button from the card
- Add image hover (second image crossfade)
- Add "Dernières pièces" badge when `stockQuantity > 0 && stockQuantity < 3`
- Same gold category label, Playfair name, price formatting

- [ ] **Step 5: Update empty state**

Find empty state (around lines 151-191). Update:
- `border-stone-300` → `border-[#E8E4E0]`
- `text-stone-400` → `text-[#999]`
- CTA button: `bg-stone-900` → `bg-[#0D0D0D]`

- [ ] **Step 6: Update bottom CTA section**

Find the CTA section (around lines 320-349). Update:
- `bg-stone-900` → `bg-[#0D0D0D]`
- Add gold ornament line
- CTA button: use `btn-luxury-gold` class
- `text-amber-700` → `text-[#C9A45C]`

- [ ] **Step 7: Verify collections page**

Run dev server, check http://localhost:3000/collections:
- Header with gold label + centered title + count
- Pill filters working (click changes URL param)
- Minimaliste cards with hover effect
- 2 columns on mobile, 4 on desktop
- Empty state visible when filtering to empty category

- [ ] **Step 8: Commit**

```bash
git add client/src/app/collections/page.tsx
git commit -m "feat(collections): luxury grid layout with pill filters"
```

---

### Task 9: Product Detail Page — 2-Column Layout, Sticky Details

**Files:**
- Modify: `client/src/app/produits/[slug]/page.tsx`

- [ ] **Step 1: Update breadcrumb**

Find breadcrumb (around lines 156-174). Update:
- `text-stone-400` → `text-[#999]`
- `hover:text-stone-900` → `hover:text-[#C9A45C]`
- Active: `text-[#0D0D0D]`
- Border: `border-stone-200` → `border-black/[0.06]`

- [ ] **Step 2: Update product layout grid**

Find the main grid (around line 177). Update:
- `grid lg:grid-cols-[1.2fr,1fr]` → keep the same ratio, but update gaps
- `gap-8 lg:gap-12 xl:gap-20` → `gap-6 lg:gap-12 xl:gap-16`
- Background: ensure `bg-[#F5F5F5]`

- [ ] **Step 3: Update product info section (right column)**

Find the sticky info section (around lines 190-432). Update colors throughout:
- "Création sur-mesure" label: `text-amber-700` → `text-[#C9A45C]`
- Product title: keep `font-luxury`, update to `text-[#0D0D0D]`
- Category tag: `text-amber-700 bg-amber-50 border-amber-200` → `text-[#C9A45C] bg-[rgba(201,164,92,0.12)] border-[#C9A45C]/20 rounded-full`
- Stock badge: keep emerald colors (they work well)
- Sticky position: `sticky top-24 md:top-28 lg:top-32` → `sticky top-20 md:top-24`

- [ ] **Step 4: Update price section**

Find price box (around lines 225-266). Update:
- Border: `border-stone-200` → `border-[#E8E4E0]`
- Price font: keep `font-luxury` serif, ensure `text-[#0D0D0D]`
- Promo badge: keep `bg-red-100 text-red-700` for visibility
- Old price strikethrough: `text-stone-400` → `text-[#999]`

- [ ] **Step 5: Update size selector**

Find sizes section (around lines 310-331). Update:
- Active size: `bg-stone-900 text-white border-stone-900` → `bg-[#0D0D0D] text-white border-[#0D0D0D]`
- Inactive: `border-stone-200` → `border-[#E8E4E0] hover:border-[#C9A45C]`
- Custom size badge: `bg-amber-50 border-amber-200` → `bg-[rgba(201,164,92,0.12)] border-[#C9A45C]/20`

- [ ] **Step 6: Update CTA buttons**

Find CTA buttons section (around lines 352-392). Update:
- Primary "Commander": `bg-stone-900 hover:bg-stone-800` → `bg-[#0D0D0D] hover:bg-[#1a1a1a] text-[11px] uppercase tracking-[0.15em]`
- Secondary "Ajouter au panier": `border-stone-900` → `border-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-white text-[11px] uppercase tracking-[0.15em]`
- Keep WhatsApp button green

- [ ] **Step 7: Update trust badges**

Find trust badges grid (around lines 395-420). Update:
- Icon background: `bg-stone-100` → `bg-[rgba(201,164,92,0.12)]`
- Icon color: → `text-[#C9A45C]`
- Text: `text-stone-600` → `text-[#666]`

- [ ] **Step 8: Update contact CTA and measurements guide sections**

Find measurements guide (around lines 442-461) and contact CTA (around lines 464-490). Update:
- Measurements: `bg-stone-100` → `bg-[#E8E4E0]`, icons `text-[#C9A45C]`
- Contact CTA: `bg-stone-900` → `bg-[#0D0D0D]`, CTA buttons use `btn-luxury-gold`

- [ ] **Step 9: Update mobile sticky CTA bar**

Find sticky mobile bar (around lines 495-545). Update:
- `border-stone-200` → `border-[#E8E4E0]`
- Buttons: match new palette, keep compact for mobile

- [ ] **Step 10: Verify product detail page**

Run dev server, navigate to any product page:
- 2-column layout (gallery left, info right)
- Gold accents on labels, category tag, trust icons
- Sticky details column on desktop scroll
- Mobile sticky footer working
- All buttons correct color

- [ ] **Step 11: Commit**

```bash
git add client/src/app/produits/[slug]/page.tsx
git commit -m "feat(product-page): luxury 2-column layout with gold accents"
```

---

### Task 10: Similar Products & Delivery Info — Palette Update

**Files:**
- Modify: `client/src/components/SimilarProducts.tsx`
- Modify: `client/src/components/DeliveryInfo.tsx`

- [ ] **Step 1: Update SimilarProducts**

In `SimilarProducts.tsx`:
- Section title: `text-amber-700` → `text-[#C9A45C]` for the label
- Heading: keep `font-serif`, ensure `text-[#0D0D0D]`
- Card category: `text-amber-700` → `text-[#C9A45C]`
- Promo badge: keep `bg-red-600 text-white`
- Hover overlay: `bg-stone-900/0 group-hover:bg-stone-900/20` → `bg-black/0 group-hover:bg-black/10`
- Border: `border-stone-200` → `border-[#E8E4E0]`

- [ ] **Step 2: Update DeliveryInfo**

In `DeliveryInfo.tsx`:
- Keep emerald gradient (it works well for delivery context)
- No major changes needed — the green delivery info stands out correctly against the new palette

- [ ] **Step 3: Commit**

```bash
git add client/src/components/SimilarProducts.tsx client/src/components/DeliveryInfo.tsx
git commit -m "feat(components): update similar products and delivery info palette"
```

---

### Task 11: MiniCart & AddToCartButton — Palette Update

**Files:**
- Modify: `client/src/components/MiniCart.tsx`
- Modify: `client/src/components/AddToCartButton.tsx`

- [ ] **Step 1: Update MiniCart**

In `MiniCart.tsx`:
- Header: `text-stone-900` → `text-[#0D0D0D]`, border `border-stone-200` → `border-[#E8E4E0]`
- Category text: `text-amber-700` → `text-[#C9A45C]`
- Order link: `text-amber-700 hover:text-amber-800` → `text-[#C9A45C] hover:text-[#A67C3D]`
- WhatsApp button: `bg-stone-900` → `bg-[#0D0D0D]`
- Continue shopping button: `border-stone-300 hover:bg-stone-100` → `border-[#E8E4E0] hover:bg-[#E8E4E0]`
- Quantity controls: `border-stone-200` → `border-[#E8E4E0]`
- Remove button: keep `hover:text-red-600`

- [ ] **Step 2: Update AddToCartButton**

In `AddToCartButton.tsx`:
- Default variant not-added: `border-stone-300` → `border-[#0D0D0D]`
- Icon variant not-added: `border-stone-300` → `border-[#E8E4E0] hover:border-[#C9A45C]`
- Added state: keep emerald colors

- [ ] **Step 3: Commit**

```bash
git add client/src/components/MiniCart.tsx client/src/components/AddToCartButton.tsx
git commit -m "feat(cart): update mini cart and add-to-cart button palette"
```

---

### Task 12: Enhanced Search Bar — Product Thumbnails

**Files:**
- Modify: `client/src/components/SearchBar.tsx`

- [ ] **Step 1: Update search input styling**

In `SearchBar.tsx`, find the input section (around lines 88-117). Update:
- Input background: `bg-stone-100 border-stone-200` → `bg-[#F5F5F5] border-[#E8E4E0]`
- Focus: `focus:border-stone-400 focus:ring-stone-300` → `focus:border-[#C9A45C] focus:ring-[#C9A45C]/20`
- Icon color: `text-stone-400` → `text-[#999]`

- [ ] **Step 2: Update dropdown results with thumbnails**

Find the results dropdown (around lines 120-188). Update the product result items to include larger thumbnails with price:

Each result item should render as:
```tsx
<Link
  href={`/produits/${product.slug}`}
  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] transition-colors"
  onClick={() => setIsOpen(false)}
>
  <div className="w-10 h-10 rounded bg-[#E8E4E0] overflow-hidden flex-shrink-0">
    {product.mainImage && (
      <img
        src={getImageUrl(product.mainImage)}
        alt=""
        className="w-full h-full object-cover"
      />
    )}
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm text-[#0D0D0D] truncate">{product.name}</p>
    <p className="text-xs text-[#C9A45C]">
      {(product.promoPrice || product.basePrice)?.toLocaleString("fr-FR")} F
    </p>
  </div>
</Link>
```

- [ ] **Step 3: Update "view all" link**

Find the "voir tous les résultats" link (around lines 175-184). Update:
- `text-stone-600 hover:bg-stone-50` → `text-[#C9A45C] hover:bg-[#F5F5F5]`

- [ ] **Step 4: Commit**

```bash
git add client/src/components/SearchBar.tsx
git commit -m "feat(search): enhanced search bar with product thumbnails and prices"
```

---

### Task 13: Cart Toast Notification

**Files:**
- Create: `client/src/components/CartToast.tsx`
- Modify: `client/src/contexts/CartContext.tsx`

- [ ] **Step 1: Add toast state to CartContext**

In `CartContext.tsx`, add toast state management. Add to the CartContextType interface (around lines 16-27):

```typescript
// Add to CartContextType
lastAddedItem: CartItem | null;
```

Add state in CartProvider (around line 34):

```typescript
const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
```

In the `addItem` callback (around lines 58-70), after adding the item, set the toast:

```typescript
setLastAddedItem(newItem);
// Auto-clear after 3.5s
setTimeout(() => setLastAddedItem(null), 3500);
```

Add `lastAddedItem` to the Provider value (around line 100).

- [ ] **Step 2: Create CartToast component**

Create `client/src/components/CartToast.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function CartToast() {
  const { lastAddedItem, setIsCartOpen } = useCart();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (lastAddedItem) {
      setLeaving(false);
      setVisible(true);
      const timer = setTimeout(() => {
        setLeaving(true);
        setTimeout(() => setVisible(false), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  if (!visible || !lastAddedItem) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const imgSrc = lastAddedItem.mainImage?.startsWith("http")
    ? lastAddedItem.mainImage
    : `${API_URL}${lastAddedItem.mainImage}`;

  return (
    <div
      className={`fixed top-20 right-4 md:right-6 z-[100] max-w-sm w-full ${
        leaving ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-[#E8E4E0] p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded bg-[#E8E4E0] overflow-hidden flex-shrink-0">
          {lastAddedItem.mainImage && (
            <img
              src={imgSrc}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#C9A45C] uppercase tracking-[0.15em] mb-0.5">
            Ajouté au panier
          </p>
          <p className="text-sm text-[#0D0D0D] font-medium truncate">
            {lastAddedItem.name}
          </p>
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-xs text-[#C9A45C] hover:text-[#A67C3D] mt-1 transition-colors"
          >
            Voir le panier →
          </button>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-[#999] hover:text-[#0D0D0D] transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add CartToast to layout**

In `client/src/app/layout.tsx`, import and render CartToast inside CartProvider, after Header:

```tsx
import CartToast from "@/components/CartToast";

// In the JSX, inside CartProvider:
<CartProvider>
  <Header />
  <CartToast />
  {children}
</CartProvider>
```

- [ ] **Step 4: Verify toast notification**

Run dev server, navigate to a product, click "Ajouter au panier":
- Toast slides in from right with product thumbnail
- Auto-dismisses after 3 seconds
- "Voir le panier" link opens MiniCart
- Close button works

- [ ] **Step 5: Commit**

```bash
git add client/src/components/CartToast.tsx client/src/contexts/CartContext.tsx client/src/app/layout.tsx
git commit -m "feat(cart): add toast notification on add-to-cart"
```

---

### Task 14: Branded 404 Page

**Files:**
- Create: `client/src/app/not-found.tsx`

- [ ] **Step 1: Create branded 404 page**

Create `client/src/app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-[#C9A45C] text-[10px] uppercase tracking-[0.3em] mb-6">
          Ibag Couture
        </p>
        <h1 className="font-luxury text-7xl md:text-9xl text-[#C9A45C] mb-4">
          404
        </h1>
        <p className="text-white/60 text-lg md:text-xl mb-2">
          Cette page n&apos;existe pas
        </p>
        <p className="text-white/30 text-sm mb-10">
          La page que vous recherchez a peut-être été déplacée ou supprimée.
        </p>
        <Link
          href="/collections"
          className="btn-luxury-gold inline-flex"
        >
          Retour aux collections
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify 404 page**

Run dev server, navigate to http://localhost:3000/nonexistent-page:
- Black background
- Gold "404" in large Playfair
- CTA button to collections

- [ ] **Step 3: Commit**

```bash
git add client/src/app/not-found.tsx
git commit -m "feat: branded luxury 404 page"
```

---

### Task 15: Page Loader & Metadata Update

**Files:**
- Create: `client/src/components/PageLoader.tsx`
- Modify: `client/src/app/layout.tsx`

- [ ] **Step 1: Create PageLoader component**

Create `client/src/components/PageLoader.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPath) {
      setLoading(true);
      setPrevPath(pathname);
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, prevPath]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[2px]">
      <div className="h-full bg-[#C9A45C] animate-page-loader" />
    </div>
  );
}
```

- [ ] **Step 2: Add PageLoader to layout and update metadata**

In `client/src/app/layout.tsx`:

Import and render PageLoader:
```tsx
import PageLoader from "@/components/PageLoader";

// Inside CartProvider, before Header:
<CartProvider>
  <PageLoader />
  <Header />
  <CartToast />
  {children}
</CartProvider>
```

Update metadata (around lines 43-125):
- `themeColor` → `#0D0D0D`
- Ensure description mentions "luxe africain" and "Dakar"

- [ ] **Step 3: Verify page loader**

Run dev server, navigate between pages:
- Thin gold bar appears at top during route transitions
- Disappears smoothly after load

- [ ] **Step 4: Commit**

```bash
git add client/src/components/PageLoader.tsx client/src/app/layout.tsx
git commit -m "feat: gold page loader bar and updated metadata"
```

---

### Task 16: Final Verification & Build

**Files:** None — verification only

- [ ] **Step 1: Run production build**

```bash
cd client && npm run build 2>&1 | tail -30
```

Expected: Build succeeds with no errors. Warnings about image optimization are OK.

- [ ] **Step 2: Visual regression check**

Start production build:
```bash
cd client && npm run start
```

Check each page at http://localhost:3000:
- [ ] Homepage: hero, cards, values, CTA
- [ ] Collections: header, filters, cards
- [ ] Product detail: gallery, details, CTA buttons
- [ ] 404 page
- [ ] Mobile responsive (resize browser to 375px width)
- [ ] Cart flow: add item → toast → open cart → verify MiniCart

- [ ] **Step 3: Verify no backend breakage**

Navigate and test:
- [ ] Add a product to cart
- [ ] Open MiniCart
- [ ] Navigate to checkout (commander page)
- [ ] Login/logout flow still works
- [ ] Search bar returns results

- [ ] **Step 4: Final commit and push**

```bash
git add -A
git status
# Review any uncommitted changes
git push origin blackboxai/luxury-ux-ui-transformation
```
