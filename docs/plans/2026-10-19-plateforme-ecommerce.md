# Plateforme e-commerce Ibag Couture — Plan de construction

> Date : 2026-10-19
> Statut : plan valide, en attente de demarrage de la phase 0

## Decisions actees

| Sujet | Choix retenu |
|-------|--------------|
| Approche | Faire evoluer l'existant (design luxury, admin, IA produit conserves) |
| Paiement | Acompte en ligne, solde a la livraison |
| Modele de vente | Pret-a-porter **et** sur-mesure dans un meme panier |
| Priorite | Remettre la boutique en ligne au plus vite |

## Le point de tension, et comment on le resout

Le tunnel de commande unifie avec paiement d'acompte represente plusieurs
semaines de travail. La priorite « remettre en ligne vite » est incompatible
avec le fait d'attendre qu'il soit termine.

La solution est de ne pas melanger les deux rythmes :

- **La boutique actuelle repart en vente des aujourd'hui** sur le cluster
  MongoDB Flex deja configure, avec son parcours existant (commande article
  par article, encaissement enregistre par l'admin). Elle vend.
- **La nouvelle plateforme se construit en parallele**, sans pression de mise
  en ligne, et remplace l'ancienne quand elle est prete et testee.

## Sequencement

Un point de methode important : toutes les fonctionnalites a venir (panier
multi-articles, livraison, stock, paiement) touchent lourdement la couche
d'acces aux donnees. Les ecrire sur MongoDB puis les reecrire sur PostgreSQL
reviendrait a faire le travail deux fois.

La migration PostgreSQL passe donc **avant** la construction des
fonctionnalites, pas apres — pendant que la boutique actuelle continue de
tourner sur Mongo.

---

## Phase 0 — Remise en vente immediate

**Objectif** : la boutique encaisse de nouveau des commandes.
**Charge estimee** : 1 a 2 heures.

1. `MONGODB_URI` du cluster Flex dans les variables Render, deploiement
2. Recreation du compte admin (`scripts/seedAdmin.js`)
3. Restauration du catalogue depuis Cloudinary
   (`scripts/restoreProductsFromCloudinary.js`), puis completion des fiches
   dans l'admin a l'aide du generateur IA existant
4. **Fermeture de la faille de securite** sur les routes produits : les
   mutations `POST`/`PUT`/`DELETE` de `/api/products` sont aujourd'hui
   accessibles sans authentification. A corriger avant tout retour en public.

## Phase 1 — Socle PostgreSQL

**Objectif** : la plateforme tourne sur PostgreSQL, a iso-fonctionnalites.
**Charge estimee** : 2 a 4 jours.

- Schema Prisma (fait, a etendre pour les phases suivantes)
- Couche d'acces aux donnees et serialiseur `_id` (le frontend lit `_id` a
  83 endroits : un seul helper preserve le contrat de l'API)
- Reecriture des 9 controleurs, dont les agregations financieres et le tri
  intelligent des produits
- Scripts de seed et de restauration Cloudinary portes sur Prisma
- Verification bout en bout avant bascule de `DATABASE_URL`

## Phase 2 — Tunnel de commande unifie

**Objectif** : un panier, plusieurs articles, standards et sur-mesure melanges,
une seule commande.
**Charge estimee** : 3 a 5 jours.

Changement structurant : la commande devient une enveloppe et les articles
sortent dans une table dediee.

- `Order` porte le client, la livraison, les totaux et le paiement
- `OrderItem` porte le produit, la taille, les mesures, les options, le prix
  unitaire, la quantite et le snapshot produit
- Le panier passe du stockage local a un panier persistant, pour que le client
  le retrouve d'un appareil a l'autre
- Les mesures sont enregistrees sur le compte client et reutilisables
  (aujourd'hui la page `/account/measures` est une maquette : rien n'est
  sauvegarde)

Deux bugs de facturation connus sont corriges a cette occasion :

- le supplement sur-mesure (`customPriceImpact`) est affiche au client mais
  **jamais ajoute au total enregistre** — la commande est sous-facturee
- le prix des options est repris depuis la requete du client au lieu d'etre
  relu depuis le produit en base

## Phase 3 — Paiement de l'acompte en ligne

**Objectif** : le client paie un acompte par Wave ou Orange Money pour lancer
la confection, et regle le solde a la livraison.
**Charge estimee** : 2 a 4 jours.

- Integration d'un agregateur mobile money (PawaPay)
- Montants calcules **cote serveur uniquement** — jamais repris de la requete
- Endpoint de retour (webhook) avec verification de signature et idempotence :
  un meme evenement recu deux fois ne doit pas encaisser deux fois
- Cycle de vie de la commande : en attente de paiement -> acompte regle ->
  en production -> prete -> livree -> soldee
- Le modele `Payment` existant gere deja la notion d'acompte et la
  resynchronisation du statut de paiement : il est etendu, pas remplace

## Phase 4 — Livraison et stock

**Objectif** : pouvoir reellement livrer, et ne plus vendre ce qui n'existe pas.
**Charge estimee** : 2 a 3 jours.

- Adresse de livraison : le bloc client d'une commande ne contient aujourd'hui
  que nom, telephone et email — il est impossible de livrer
- Zones et frais de livraison configurables (Dakar / regions), retrait en
  boutique possible
- Stock reellement verifie a la commande et decremente a la validation : les
  champs `hasStock` et `stockQuantity` existent mais ne sont jamais lus
- Suivi de commande accessible a un visiteur non connecte, via son numero de
  commande

## Phase 5 — Fiabilite

**Objectif** : que l'incident d'aout ne puisse pas se reproduire.
**Charge estimee** : 1 jour.

- Sauvegarde automatique planifiee, stockee **hors** du fournisseur de base de
  donnees
- Fin des pannes silencieuses : les pages vitrines avalent aujourd'hui les
  erreurs d'API sans rien afficher ni journaliser, ce qui a masque une panne
  pendant deux mois et demi
- Surveillance externe de `/health` avec alerte par email
- Alertes de facturation activees chez l'hebergeur et le fournisseur de base

---

## Charge totale

Environ **2 a 3 semaines** de travail concentre pour les phases 1 a 5, la
boutique restant en vente pendant toute la duree grace a la phase 0.

## Decisions restant a prendre

- **Montant de l'acompte** : pourcentage global (50 % par defaut) ou reglable
  par produit ?
- **Zones de livraison** et tarifs associes
- **Delais de confection** affiches au client pour les articles sur-mesure
- Faut-il conserver le parcours actuel `/commander/[slug]` en parallele du
  panier pendant la transition ?
