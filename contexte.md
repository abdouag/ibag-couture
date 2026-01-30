# Ibag Couture — Contexte Projet (Source de Verite)

> **Ce fichier est la reference absolue du projet.**
> Toute modification du code doit etre coherente avec ce document.
> Toute modification du projet doit etre documentee dans l'historique ci-dessous.

---

## 1. Presentation du Projet

- **Nom** : Ibag Couture
- **Type** : Boutique de couture / e-commerce
- **Objectif** :
  - Vente de vetements (pret-a-porter + sur mesure)
  - Produits standards + produits sur mesure (configurable par produit)
  - Experience mobile-first
  - Panier, recherche temps reel, compte client
  - Administration complete (produits, commandes, images)

---

## 2. Stack Technique (Figee)

> Toute modification de stack est INTERDITE sans validation explicite.

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | Next.js (App Router) | 16.x |
| UI | React + TypeScript | 19.x / 5.x |
| Styling | Tailwind CSS | 4.x |
| Backend | Express.js | 5.x |
| Base de donnees | MongoDB (Mongoose) | Mongoose 9.x |
| Auth | JWT custom (jsonwebtoken + bcryptjs) | - |
| Upload fichiers | Multer + Cloudinary | 2.x / 1.x |
| Securite | Helmet, CORS, express-validator | - |
| Dev | nodemon, ESLint | - |

**Ports** :
- Frontend : `http://localhost:3000`
- Backend API : `http://localhost:5000`

**Ne jamais proposer** : Firebase, Supabase, Prisma, ou autre stack sans validation.

---

## 3. Structure du Projet

### Frontend (`client/`)

```
client/src/
  app/
    page.tsx                        # Accueil (collections en vedette)
    login/page.tsx                  # Connexion
    register/page.tsx               # Inscription
    account/page.tsx                # Compte client
    account/orders/page.tsx         # Mes commandes
    account/measures/page.tsx       # Mes mesures
    collections/page.tsx            # Catalogue produits
    produits/[slug]/page.tsx        # Fiche produit
    commander/[slug]/page.tsx       # Formulaire commande (tailles, mesures, options)
    admin/page.tsx                  # Dashboard admin
    admin/products/page.tsx         # Liste produits admin
    admin/products/new/page.tsx     # Creer un produit
    admin/products/[id]/edit/page.tsx # Modifier un produit
    admin/orders/page.tsx           # Gestion commandes
    globals.css                     # Styles globaux + animations custom
    layout.tsx                      # Layout racine (CartProvider + Header)
  components/
    Header.tsx                      # Header responsive (search + cart + nav)
    Footer.tsx                      # Footer (contact, liens, copyright)
    SearchBar.tsx                   # Recherche temps reel avec dropdown
    MiniCart.tsx                     # Drawer panier lateral
    AddToCartButton.tsx             # Bouton "Ajouter au panier"
    ProductGallery.tsx              # Galerie images produit
    CategoryFilter.tsx              # Filtre par categorie
    admin/ImageUpload.tsx           # Upload image principale (admin)
    admin/MultiImageUpload.tsx      # Upload images multiples (admin)
  contexts/
    CartContext.tsx                  # Context React panier + localStorage
  hooks/
    useDebounce.ts                  # Hook debounce generique
  lib/
    api.ts                          # Fonctions fetch vers le backend
```

### Backend (`backend/`)

```
backend/
  models/
    User.js                         # Utilisateur (email, password, role)
    Product.js                      # Produit (nom, prix, images, tailles, options, sur-mesure)
    Order.js                        # Commande (client, produit, mesures, statut)
  routes/
    auth.routes.js                  # POST /register, /login, GET /me
    product.routes.js               # CRUD produits + recherche
    order.routes.js                 # CRUD commandes
    upload.routes.js                # Upload images (Multer)
  middleware/
    auth.js                         # JWT protect, restrictTo, adminOnly
    errorHandler.js                 # Gestion erreurs globale
    notFound.js                     # 404 handler
    validate.js                     # Validation express-validator
  config/
    database.js                     # Connexion MongoDB
```

---

## 4. Design & UI

### Palette de couleurs

| Role | Couleur Tailwind | Usage |
|------|-----------------|-------|
| Primaire | `stone-*` (50 a 900) | Texte, bordures, fonds, boutons principaux |
| Accent | `amber-700` | Liens actifs, badges categorie, CTA secondaires |
| Succes | `green-50/500/700` | Feedback "Ajoute au panier" |
| Erreur | `red-50/600/700` | Bouton deconnexion, messages d'erreur |
| Fond principal | `stone-50` | Background pages |
| Fond header | `white/95` + `backdrop-blur` | Header transparent |

### Typographies

| Police | Variable CSS | Usage |
|--------|-------------|-------|
| Geist Sans | `--font-geist-sans` | Corps de texte, UI |
| Geist Mono | `--font-geist-mono` | Code, donnees techniques |
| `font-serif` (Tailwind) | - | Titres, prix, noms produits |

### Regles responsive

- **Mobile-first** : tout design commence par mobile
- **Grille produits** : 2 colonnes sur mobile, 3 sur tablette, 4 sur desktop
- **Header mobile** : burger a gauche, logo centre, icones (compte + panier) a droite, recherche pleine largeur en 2e ligne
- **Header desktop** : logo a gauche, recherche au centre, navigation + icones a droite
- **Logo** : `h-10 md:h-14` — fichier `/public/logo.png`
- **Sticky mobile CTA** : barre fixe en bas sur les fiches produits (prix + bouton Commander)

### Animations custom (globals.css)

| Classe | Animation | Duree |
|--------|-----------|-------|
| `animate-fadeIn` | Apparition avec translateY(-8px) | 0.2s |
| `animate-slideInRight` | Glissement depuis la droite (drawer panier) | 0.3s |
| `animate-fadeInBackdrop` | Fondu overlay sombre | 0.2s |

### Composants cles

- **Header** : navigation, recherche temps reel, icone panier avec badge, icone compte, menu burger mobile
- **Footer** : 2 variantes (complet + compact), contact reel (tel, email, adresse Google Maps "Ibag Couture")
- **Cards produit** : image avec overlay hover, badge categorie, nom, prix en FCFA
- **Bouton principal** : `bg-stone-900 text-white` uppercase tracking-wide
- **Bouton secondaire** : `border border-stone-300 text-stone-700` outline

---

## 5. Logique Fonctionnelle

### Authentification

- JWT custom (pas de provider externe)
- Inscription / Connexion par email + mot de passe
- Roles : `user` (client) et `admin`
- Middleware `protect` : verifie le token Bearer
- Middleware `adminOnly` : restreint l'acces admin

### Produits

- Images multiples par produit (image principale + galerie)
- Tailles configurables par produit (S, M, L, XL, XXL, etc.)
- Option **sur-mesure** activable par produit (pas globale)
- Impact prix sur-mesure configurable (`customPriceImpact`)
- Options supplementaires avec prix (liste nom + prix)
- Delai de confection en jours ouvrables
- Statut actif/inactif (`isActive`)
- Recherche par texte (MongoDB text index)
- Filtrage par categorie

### Panier (cote client)

- Stockage **localStorage** (cle `ibag-cart`)
- Context React (`CartProvider` dans layout.tsx)
- Donnees stockees : productId, slug, name, category, basePrice, mainImage, quantity
- **Pas de taille/options dans le panier** — chaque article renvoie vers `/commander/[slug]` pour configuration individuelle (coherent avec le modele couture sur mesure)
- Badge panier avec `isHydrated` flag (evite mismatch SSR)
- Drawer lateral droit avec animation slideInRight

### Recherche

- Endpoint : `GET /api/products?search=X&limit=5&isActive=true`
- Debounce 300ms, minimum 2 caracteres
- Dropdown avec resultats : image, nom, categorie, prix
- Lien "Voir tous les resultats" vers `/collections?search=X`

### Commandes

- Formulaire sur `/commander/[slug]` (taille, mesures personnalisees, options)
- Suivi commandes cote client (`/account/orders`)
- Gestion commandes cote admin (`/admin/orders`)

### Compte client

- Informations personnelles
- Historique commandes
- Mesures enregistrees (`/account/measures`)

---

## 6. Historique des Modifications

### [2025-01-30] — Setup initial et fonctionnalites de base
- **Type** : Full stack
- **Description** : Mise en place du projet complet (frontend Next.js + backend Express/MongoDB)
- **Fonctionnalites** : Admin dashboard, CRUD produits, upload images, gestion commandes, auth JWT

### [2025-01-30] — Refonte produits
- **Type** : Backend + Admin UI
- **Description** : Images multiples par produit, tailles par produit, option sur-mesure conditionnelle
- **Fichiers** : Product.js, admin/products/*, ImageUpload, MultiImageUpload

### [2025-01-30] — Fix images cross-origin
- **Type** : Backend
- **Description** : Helmet.js bloquait les images cross-origin (CORP). Ajout `crossOriginResourcePolicy: "cross-origin"`
- **Fichiers** : backend/server.js

### [2025-01-30] — Responsive + Header + Footer
- **Type** : UI/UX
- **Description** : Grille 2 colonnes mobile (collections + accueil), header agrandi, footer avec contact reel (tel, email, adresse Google Maps "Ibag Couture")
- **Fichiers** : collections/page.tsx, page.tsx, Header.tsx, Footer.tsx

### [2025-01-30] — Header moderne + Recherche + Panier
- **Type** : UI/UX + Logic
- **Description** : Redesign complet du header (burger/logo/search/icons). Ajout recherche temps reel, panier localStorage avec drawer lateral, bouton "Ajouter au panier" sur fiche produit.
- **Fichiers crees** : useDebounce.ts, CartContext.tsx, SearchBar.tsx, MiniCart.tsx, AddToCartButton.tsx
- **Fichiers modifies** : Header.tsx, layout.tsx, globals.css, produits/[slug]/page.tsx

### [2025-01-30] — Fix build Vercel (TypeScript + Suspense)
- **Type** : Build / Config
- **Description** : Correction des erreurs bloquant le build production Vercel. Remplacement de `JSX.Element` par `ReactNode` dans admin/orders. Ajout de `<Suspense>` autour des composants utilisant `useSearchParams()` (register/page.tsx, CategoryFilter.tsx). tsconfig.json passe en `strict: false`.
- **Fichiers modifies** : tsconfig.json, admin/orders/page.tsx, register/page.tsx, components/CategoryFilter.tsx
- **Impact** : `npm run build` passe a 100% (14/14 pages generees)

### [2025-01-30] — Fix build Vercel (API fetch au build time)
- **Type** : Build
- **Description** : Les pages server-side (page.tsx, collections, produits) utilisaient `api()` qui crashait au build Vercel car le backend n'est pas disponible pendant le build. Remplacement par `fetch()` direct avec `cache: "no-store"` et try/catch. Homepage forcee en `dynamic = "force-dynamic"`. Suppression de l'import `api` dans les 3 pages concernees.
- **Fichiers modifies** : app/page.tsx, app/collections/page.tsx, app/produits/[slug]/page.tsx
- **Impact** : Build Vercel passe sans erreur. Homepage passe de statique a dynamique.

### [2025-01-30] — Separation layouts client / admin
- **Type** : UI / Architecture
- **Description** : Le header client (logo, recherche, panier) s'affichait sur les pages /admin. Ajout d'un guard `usePathname()` dans Header.tsx qui retourne `null` si la route commence par `/admin`. L'admin conserve son propre layout dedie (sidebar + header admin).
- **Fichiers modifies** : components/Header.tsx
- **Regle** : toute future page admin doit etre sous `/admin/*`. Le header client ne s'affiche jamais sur ces routes.

### [2025-01-30] — Fix affichage images produits
- **Type** : UI / Config
- **Description** : Correction definitive de l'affichage des images produits. 3 problemes corriges :
  1. **next.config.ts** : ajout de `remotePatterns` pour autoriser les images depuis Render (`ibag-couture.onrender.com`) et localhost (`localhost:5000`)
  2. **ProductGallery.tsx** : image principale passee de `object-cover` (rognage) a `object-contain` (ratio preserve) avec fond `bg-white`. Ajout de `handleImgError` avec fallback SVG sur erreur de chargement. `onError` attache sur image principale et miniatures.
  3. **Toutes les pages** : ajout de `onError` sur tous les `<img>` produits pour masquer gracieusement les images cassees (le fond gradient/placeholder reste visible).
- **Fichiers modifies** : next.config.ts, components/ProductGallery.tsx, app/page.tsx, app/collections/page.tsx, app/commander/[slug]/page.tsx, components/MiniCart.tsx, components/SearchBar.tsx
- **Regle** : toute nouvelle image produit doit utiliser `onError` pour un fallback propre. Les images en grille utilisent `object-cover`, l'image principale en detail utilise `object-contain`.
- **Note** : Render a un filesystem ephemere — les images uploadees sont perdues au redeploy. Une solution de stockage persistant (S3/Cloudinary) sera necessaire en production.

### [2025-01-30] — Migration Cloudinary (stockage images persistant)
- **Type** : Backend / Config / Infra
- **Description** : Remplacement du stockage local Multer (filesystem ephemere Render) par Cloudinary. Les images sont desormais stockees sur le CDN Cloudinary et ne sont plus perdues au redeploy.
  1. **config/cloudinary.js** (cree) : configuration du SDK Cloudinary v2
  2. **routes/upload.routes.js** : `multer.diskStorage` remplace par `CloudinaryStorage`. Les URLs retournees sont maintenant des URLs absolues Cloudinary (`https://res.cloudinary.com/...`). La suppression utilise `cloudinary.uploader.destroy()`.
  3. **next.config.ts** : ajout de `res.cloudinary.com` dans `remotePatterns`
  4. **.env.example** : ajout des variables `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Fichiers crees** : backend/config/cloudinary.js
- **Fichiers modifies** : backend/routes/upload.routes.js, client/next.config.ts, backend/.env.example
- **Dependencies ajoutees** : `cloudinary`, `multer-storage-cloudinary`
- **Impact frontend** : aucun changement necessaire — les helpers `getFullUrl`/`getImageUrl` detectent deja les URLs absolues via `url.startsWith("http")`
- **Variables Render** : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` a configurer dans le dashboard Render

### [2025-01-30] — Fix upload Cloudinary en production
- **Type** : Backend / Debug
- **Cause** : L'upload echouait en production avec "Une erreur interne est survenue". Les erreurs Cloudinary (credentials manquantes/invalides) etaient des `Error` bruts, pas des `AppError`. Le `errorHandler.js` en production masquait le vrai message pour les erreurs non-operationnelles.
- **Correctifs** :
  1. **upload.routes.js** : creation d'un helper `handleUploadError()` qui detecte les erreurs Cloudinary specifiques (cloud_name manquant, API key invalide, signature invalide) et les wrappe en `AppError` avec un message clair. Ajout de logs `[UPLOAD]` avant/apres chaque upload.
  2. **upload.routes.js** : verification des env vars au demarrage avec warning console.
  3. **errorHandler.js** : en production, les erreurs non-operationnelles affichent maintenant `err.message` (au lieu du generique) et loguent le stack complet.
- **Fichiers modifies** : backend/routes/upload.routes.js, backend/middleware/errorHandler.js
- **Regle** : toute erreur backend doit etre wrappee en `AppError` pour que le message atteigne le frontend. Ne jamais passer un `Error` brut a `next()`.

### [2025-01-30] — CORS production + seed admin
- **Type** : Backend / Config
- **Description** : Ajout des origines CORS de production (ibagcouture.com, vercel.app) dans le fallback du config backend. Creation du script `scripts/seedAdmin.js` pour generer le premier compte admin sur MongoDB Atlas.
- **Fichiers modifies** : backend/config/index.js
- **Fichiers crees** : backend/scripts/seedAdmin.js

---

## 7. Regles Finales

1. **contexte.md doit toujours etre a jour** apres chaque modification
2. **Toute modification non documentee est interdite**
3. **Ce fichier est la reference absolue du projet**
4. **Toute decision doit s'aligner avec ce fichier**
5. **Ne jamais casser l'existant** — pas de refactor inutile
6. **Pas de changement de logique metier sans validation**
7. **Respect strict de la structure actuelle**
8. **Chaque modification doit etre justifiee**
