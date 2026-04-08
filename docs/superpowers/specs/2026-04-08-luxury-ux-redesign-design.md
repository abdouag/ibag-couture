# Ibag Couture — Luxury UX/UI Redesign Spec

## Overview

Premium UI/UX redesign of ibagcouture.com — an African luxury fashion e-commerce platform based in Dakar, Senegal. The goal is to elevate the visual identity to compete with brands like Dior, Jacquemus, and Zara while preserving all existing backend logic, APIs, and functionality (cart, orders, payments, auth, admin).

## Constraints

- **No backend changes** — APIs, routes, controllers, services untouched
- **No logic changes** — CartContext, auth, checkout flow, admin all preserved
- **Frontend only** — CSS, component markup, layout, animations
- **Existing stack** — Next.js 16, Tailwind v4, Playfair Display, Geist, Cormorant Garamond

---

## 1. Design System — Color Palette & Typography

### Color Palette (replaces current stone/amber)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-black` | `#0D0D0D` | Primary text, dark backgrounds, buttons |
| `--color-white` | `#F5F5F5` | Page backgrounds, light surfaces |
| `--color-gold` | `#C9A45C` | Accents, badges, CTAs secondary, links |
| `--color-gold-light` | `rgba(201,164,92,0.12)` | Subtle gold backgrounds |
| `--color-gray-100` | `#E8E4E0` | Card backgrounds, dividers |
| `--color-gray-400` | `#999999` | Secondary text, muted |
| `--color-gray-600` | `#666666` | Body text secondary |
| `--color-success` | `#22C55E` | In-stock indicator |
| `--color-promo` | `#DC2626` | Promo badge, strikethrough |

### Typography

- **Headings:** Playfair Display (serif) — keep existing `font-luxury` class
- **Body:** Inter or Geist (sans-serif) — keep existing
- **Accents:** Cormorant Garamond (serif alt) — keep existing `font-luxury-alt`
- **Labels/Badges:** 9-11px, uppercase, letter-spacing: 2-4px, Geist

### Spacing Scale

- Section padding: `py-20 md:py-28 lg:py-36` (increased from current py-16/py-24)
- Card gaps: `gap-4 md:gap-6`
- Content max-width: `max-w-7xl` (1280px)

---

## 2. Homepage

### 2.1 Hero Section

**Keep:** HeroDynamicGallery slideshow component (Ken Burns effect, auto-rotate)

**Change:**
- Move text overlay to **bottom-left** (currently centered)
- Add darker gradient overlay from bottom: `linear-gradient(transparent 30%, rgba(0,0,0,0.85))`
- Above title: gold label `IBAG COUTURE — DAKAR` (9px, letter-spacing: 4px, color: gold)
- Title: `L'élégance africaine, redéfinie` — Playfair Display, font-light, with `<em>` on "redéfinie"
- Two CTA buttons side by side:
  - Primary: `DÉCOUVRIR LA COLLECTION` — bg gold, text black, 11px, letter-spacing 2px
  - Secondary: `SUR-MESURE` — border white/30%, text white, 11px
- Height: `min-h-[90vh]` on desktop, `min-h-[75vh]` on mobile

### 2.2 Featured Products Section

**Title block:**
- Gold label: `NOS CRÉATIONS` (9px, letter-spacing 3px)
- Heading: `Créations Phares` — Playfair Display, text-3xl md:text-4xl
- Centered alignment

**Product grid:**
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Card style: Minimaliste luxe (see section 5)
- Max 8 products displayed
- Keep existing category diversity algorithm

### 2.3 Values / Trust Section (new)

3-column layout (1 col on mobile):

| Icon | Title | Description |
|------|-------|-------------|
| Truck | Livraison rapide | 24-72h à Dakar et environs |
| Shield | Qualité premium | Tissus sélectionnés, couture artisanale |
| Lock | Paiement sécurisé | Vos données protégées |

- Background: `#0D0D0D`
- Text: white
- Icons: gold (#C9A45C)
- Separator lines between items on desktop

### 2.4 Popular Products Section

- Same grid style as 2.2
- Different product set (use existing API with different offset or category to avoid duplicates with featured)
- Gold label: `LES PLUS DEMANDÉS`

### 2.5 CTA Banner Section (new/improved)

- Full-width, background: `#0D0D0D`
- Centered text: `Commandez votre style aujourd'hui` — Playfair, text-3xl, white
- Subtitle: `Créations sur-mesure et prêt-à-porter de luxe africain`
- CTA button: gold bg, black text: `VOIR LA COLLECTION`
- Subtle gold line ornament above/below

---

## 3. Collections Page

### 3.1 Page Header

- Centered layout
- Gold label: `IBAG COUTURE` (9px, letter-spacing 3px)
- Title: `Nos Collections` — Playfair Display, text-4xl
- Product count: `24 créations` — gray muted text
- Background: white

### 3.2 Category Filters

- Horizontal pills row, scrollable on mobile
- Active state: `bg-[#0D0D0D] text-white` rounded-full
- Inactive: `border border-gray-200 text-gray-500` rounded-full
- Categories: Tous, Homme, Femme, Traditionnel, Moderne
- Font: 10-11px, uppercase, letter-spacing 1px

### 3.3 Product Grid

- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Gap: `gap-4 md:gap-6`
- Card style: Minimaliste luxe (section 5)
- Responsive: 2 columns on mobile (important for UX)
- Loading state: skeleton cards with pulse animation

---

## 4. Product Detail Page

### 4.1 Breadcrumb

- Format: `Accueil / Collections / {product.name}`
- Color: gray muted, links with hover gold
- Padding: `py-4 md:py-6`

### 4.2 Main Layout — 2 Columns

**Left column (55% width):**
- Thumbnail strip vertical on left (60px wide)
  - Active thumbnail: gold border (2px solid #C9A45C)
  - Inactive: gray border
  - Max 4-5 visible, scrollable if more
- Main image: `aspect-[4/5]`, rounded-lg
- Category badge: top-left, bg black, text gold
- Click to zoom (existing behavior preserved)

**Right column (45% width) — sticky:**
- Product name: Playfair Display, text-2xl md:text-3xl
- Sur-mesure label (if applicable): gold text, 10px, letter-spacing
- Category tag: pill style, border gold
- Stock indicator:
  - Green dot (6px, animated pulse) + "En stock (X)" text
  - Or gray dot + "Rupture de stock"
- Price block:
  - Current price: Playfair, text-2xl, font-semibold
  - Old price (if promo): strikethrough, gray
  - Promo badge: gold bg, "-XX%" text
- Size selector:
  - Grid of size buttons
  - Active: bg black, text white
  - Inactive: border gray
  - "Sur-mesure" option if applicable
- Description: body text, max-w for readability
- Options (if any): cards with checkbox style
- CTA buttons (stacked):
  - Primary: `COMMANDER MAINTENANT` — bg #0D0D0D, text white, full width, py-4, text-sm, letter-spacing 2px
  - Secondary: `AJOUTER AU PANIER` — border #0D0D0D, full width
  - WhatsApp button: green accent (keep existing)

### 4.3 Trust Badges (below CTA)

Inline row: Paiement sécurisé | Fait main | Livraison 24-72h
- Small icons + text, gray muted
- Subtle dividers

### 4.4 Similar Products

- Section title: `Vous aimerez aussi` — Playfair
- Same card style, horizontal scroll on mobile or grid 4-col desktop
- Keep existing SimilarProducts component logic

### 4.5 Mobile Sticky Footer

- Fixed bottom bar on mobile (< lg)
- Price on left, "Commander" + "Panier" buttons on right
- Background white, shadow-lg top
- Keep existing behavior

---

## 5. Product Card Component (shared)

Used across homepage, collections, similar products.

**Structure:**
```
┌─────────────────────┐
│  [Image 4:5 ratio]  │
│  ┌──────┐           │
│  │NOUVEAU│           │  ← badge top-left (optional)
│  └──────┘           │
│  ┌──────┐           │
│  │ -20% │           │  ← promo badge (optional, gold bg)
│  └──────┘           │
├─────────────────────┤
│ HOMME               │  ← category, gold, 9px, letter-spacing
│ Ensemble Horizon    │  ← name, Playfair serif, 15px
│ 45 000 F  ̶5̶5̶ ̶0̶0̶0̶ │  ← price + old price
└─────────────────────┘
```

- Image container: `bg-[#E8E4E0]` fallback, `aspect-[4/5]`, rounded-md
- Badge "Nouveau": bg #0D0D0D, text #C9A45C, 8-9px, letter-spacing
- Badge promo: bg #C9A45C, text white, 8-9px
- Category: #C9A45C, 9px, uppercase, letter-spacing 2px
- Name: Playfair Display, 14-15px, #0D0D0D, one line truncated
- Price: 15-16px, font-semibold, #0D0D0D
- Old price: 12px, line-through, #999
- Hover: subtle scale(1.02) transition 0.3s
- Entire card is a link to product page — no add-to-cart button on card
- Padding below image: 12-14px

---

## 6. Header

### 6.1 Announcement Bar

- Background: `#0D0D0D`
- Text: white, 11px
- Gold accent on key words (e.g., "Livraison gratuite")
- Dismissible (keep existing behavior)

### 6.2 Main Header

- 3-column grid: navigation | logo (centered) | icons
- Background: white
- Border-bottom: 1px solid rgba(0,0,0,0.06)
- Height: `h-16 md:h-20`
- Logo: centered, Playfair Display or logo image
- Left (desktop): nav links — Collections, Homme, Femme, Contact
  - Style: 11px, uppercase, letter-spacing 2px, hover gold underline
- Right: search icon + account icon + cart icon
  - Cart badge: bg gold, text black, rounded-full
- Sticky on scroll with subtle shadow

### 6.3 Mobile Header

- Burger menu left, logo center, cart right
- Mobile drawer: full-screen overlay, slide from left
- Nav links stacked, large touch targets (48px min)

---

## 7. Footer

- Background: `#0D0D0D`
- Grid: 3-4 columns on desktop, stacked on mobile
- Column 1: Logo + brand description (Playfair)
- Column 2: Liens utiles — Collections, Homme, Femme, Contact
- Column 3: Contact — phone, email, address, WhatsApp link (gold)
- Bottom bar: copyright + social icons (Instagram, Facebook, WhatsApp)
- Social icons: white, hover gold transition
- Keep existing map on full variant (contact page)

---

## 8. Micro-Animations & Polish

### Hover Effects
- Cards: `scale(1.02)` with `transition: 0.3s cubic-bezier(0.16,1,0.3,1)`
- Buttons: slight brightness shift or shadow elevation
- Links: gold color transition, underline offset animation
- Images: subtle zoom in on hover (scale 1.05, overflow hidden)

### Scroll Animations
- Keep existing ScrollReveal component
- Apply to: section titles, product grids (staggered), trust badges, CTA sections
- Subtle fade-in-up, 0.4-0.6s duration

### Page Transitions
- Stock indicator: continuous pulse animation (keep existing stockPulse)
- Cart badge: brief scale pop on item add
- Filter pills: smooth active state transition

### Loading States
- Skeleton cards with pulse animation for product grids
- Smooth image loading with fade-in on load

---

## 9. Mobile Optimizations

- Product grid: always 2 columns, `gap-3`
- Touch targets: minimum 44px height on all interactive elements
- Buttons: full-width on mobile, `py-4` for comfortable tap
- Font sizes: slightly reduced but maintaining readability (min 14px body)
- Sticky mobile CTA footer on product pages (keep existing)
- Horizontal scroll for filter pills
- Simplified header: burger + logo + cart only
- No hover-dependent interactions

---

## 10. Additional UX Enhancements

### 10.1 Enhanced Search Bar

Upgrade the existing SearchBar dropdown to show product image thumbnails alongside text results. Each result row: product image (40x40, rounded) + name + price. Max 5 results with debounce (keep existing 300ms).

### 10.2 "Added to Cart" Toast Notification

When a product is added to cart, show an animated toast notification (slide in from top-right, auto-dismiss after 3s). Content: product thumbnail + name + "Ajouté au panier" + link to view cart. Replace the current button-only state change.

### 10.3 "Dernières pièces" Badge

On product cards, when `stock < 3 && stock > 0`, show an orange/amber badge: `DERNIÈRES PIÈCES`. Position: top-left, below "Nouveau" badge if both apply. Color: `#D97706` bg, white text.

### 10.4 Branded 404 Page

Create `client/src/app/not-found.tsx` with:
- Black background (#0D0D0D)
- Large "404" in Playfair Display, gold color
- Text: "Cette page n'existe pas"
- CTA button: "Retour aux collections" → /collections
- Consistent with luxury brand identity

### 10.5 Product Card Image Hover

On desktop, when hovering a product card that has more than 1 image, crossfade to the second image. Use CSS transition (opacity 0.4s). Preload second image on card mount. No effect on mobile (no hover).

### 10.6 Premium Page Loader

Add a thin gold progress bar at the very top of the page during Next.js route transitions. Height: 2px, color: #C9A45C, animated left-to-right. Use Next.js `useRouter` events or a lightweight NProgress-style implementation.

### 10.7 Favicon & Metadata Update

Update favicon to match luxury identity (gold "I" on black background or similar). Ensure Open Graph default image reflects the new brand palette. Update `layout.tsx` metadata: description, theme-color (#0D0D0D).

---

## 11. Files to Modify

| File | Changes |
|------|---------|
| `client/src/app/globals.css` | New color variables, updated utility classes |
| `client/src/app/page.tsx` | Hero layout, sections restructure, values/CTA sections |
| `client/src/app/collections/page.tsx` | Header, filters, grid layout |
| `client/src/app/produits/[slug]/page.tsx` | 2-col layout, gallery, sticky details |
| `client/src/components/Header.tsx` | Logo centered, colors, announcement bar |
| `client/src/components/Footer.tsx` | Dark theme, restructured layout |
| `client/src/components/ProductCardActions.tsx` | Minimaliste luxe card style |
| `client/src/components/ProductGallery.tsx` | Vertical thumbnails layout |
| `client/src/components/HeroDynamicGallery.tsx` | Overlay gradient adjustment |
| `client/src/components/CategoryFilter.tsx` | Pill-style filters |
| `client/src/components/AddToCartButton.tsx` | Updated button styles |
| `client/src/components/MiniCart.tsx` | Color scheme update |
| `client/src/components/SearchBar.tsx` | Styled to match palette |
| `client/src/components/SimilarProducts.tsx` | Updated card display |
| `client/src/components/DeliveryInfo.tsx` | Styled to match palette |
| `client/src/components/ScrollReveal.tsx` | No logic changes, maybe timing tweaks |
| `client/src/components/CartToast.tsx` | **New** — toast notification on add-to-cart |
| `client/src/app/not-found.tsx` | **New** — branded 404 page |
| `client/src/app/layout.tsx` | Page loader, favicon, metadata update |

### Files NOT Modified

- `client/src/contexts/CartContext.tsx` — cart logic untouched
- `client/src/app/commander/[slug]/page.tsx` — checkout flow untouched (styling only if needed)
- `client/src/app/admin/**` — admin pages untouched
- `client/src/app/account/**` — account pages untouched
- `backend/**` — entire backend untouched
