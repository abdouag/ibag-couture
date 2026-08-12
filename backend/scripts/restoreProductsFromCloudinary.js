/**
 * Restauration du catalogue depuis Cloudinary
 *
 * Apres une perte de la base MongoDB, les images produits restent intactes sur
 * Cloudinary. Ce script les liste et recree un produit brouillon par image, pour
 * eviter de repartir d'un catalogue totalement vide.
 *
 * Les images envoyees coup sur coup (image principale + galerie d'un meme
 * produit) sont regroupees sur une seule fiche, pour eviter les doublons.
 *
 * Les produits crees sont volontairement INACTIFS (isActive: false) : ils
 * n'apparaissent pas sur la boutique tant qu'un admin ne les a pas completes
 * (nom, prix, categorie, description) puis actives depuis /admin/products.
 *
 * Le script est rejouable : une image deja rattachee a un produit est ignoree.
 *
 * Usage :
 *   node scripts/restoreProductsFromCloudinary.js                  # simulation (aucune ecriture)
 *   node scripts/restoreProductsFromCloudinary.js --apply          # cree les produits
 *   node scripts/restoreProductsFromCloudinary.js --apply --category=femme --price=25000
 *   node scripts/restoreProductsFromCloudinary.js --group-window=300   # regroupement plus large
 *   node scripts/restoreProductsFromCloudinary.js --no-group           # une fiche par image
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Product = require('../models/Product');
const config = require('../config');

// Dossiers Cloudinary utilises par l'application (uploads admin + images generees par l'IA)
const CLOUDINARY_PREFIXES = ['ibag-couture/products', 'ibag/products/ai'];

const VALID_CATEGORIES = ['homme', 'femme', 'traditionnel', 'moderne'];

// L'upload admin accepte jusqu'a 6 images par produit (cf. upload.routes.js)
const MAX_IMAGES_PER_PRODUCT = 6;

// Les images d'un meme produit ont ete envoyees en une seule fois : leurs dates
// d'upload sont donc tres proches. On regroupe sur cet ecart (en secondes).
const DEFAULT_GROUP_WINDOW_SECONDS = 120;

/**
 * Lit les options passees en ligne de commande
 */
function parseArgs(argv) {
  const args = {
    apply: argv.includes('--apply'),
    category: 'moderne',
    price: 0,
    groupWindow: argv.includes('--no-group') ? 0 : DEFAULT_GROUP_WINDOW_SECONDS,
  };

  for (const arg of argv) {
    if (arg.startsWith('--category=')) {
      args.category = arg.slice('--category='.length);
    }
    if (arg.startsWith('--price=')) {
      args.price = parseFloat(arg.slice('--price='.length));
    }
    if (arg.startsWith('--group-window=')) {
      args.groupWindow = parseFloat(arg.slice('--group-window='.length));
    }
  }

  if (!VALID_CATEGORIES.includes(args.category)) {
    throw new Error(
      `Categorie invalide: "${args.category}". Valeurs acceptees: ${VALID_CATEGORIES.join(', ')}`
    );
  }
  if (!Number.isFinite(args.price) || args.price < 0) {
    throw new Error('Le prix (--price) doit etre un nombre positif ou nul');
  }
  if (!Number.isFinite(args.groupWindow) || args.groupWindow < 0) {
    throw new Error('La fenetre de regroupement (--group-window) doit etre un nombre de secondes positif ou nul');
  }

  return args;
}

/**
 * Regroupe les images uploadees coup sur coup : elles appartenaient tres
 * probablement au meme produit (image principale + galerie).
 *
 * @param {Array} images - images triees par date d'upload croissante
 * @param {number} windowSeconds - ecart max entre 2 images d'un meme groupe (0 = pas de regroupement)
 * @returns {Array<Array>} groupes d'images
 */
function groupImagesByUploadTime(images, windowSeconds) {
  if (windowSeconds <= 0) {
    return images.map((image) => [image]);
  }

  const groups = [];
  let current = [];
  let previousTime = null;

  for (const image of images) {
    const time = new Date(image.created_at).getTime();
    const isFarFromPrevious = previousTime !== null && time - previousTime > windowSeconds * 1000;
    const isGroupFull = current.length >= MAX_IMAGES_PER_PRODUCT;

    if (current.length > 0 && (isFarFromPrevious || isGroupFull)) {
      groups.push(current);
      current = [];
    }

    current.push(image);
    previousTime = time;
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}

/**
 * Verifie que toutes les variables d'environnement necessaires sont presentes
 */
function checkEnv() {
  const missing = [
    'MONGODB_URI',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(', ')}.\n` +
      'Renseignez-les dans backend/.env avant de lancer le script.'
    );
  }
}

/**
 * Liste toutes les images d'un dossier Cloudinary (avec pagination)
 */
async function listImages(prefix) {
  const images = [];
  let nextCursor;

  do {
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix,
      max_results: 500,
      next_cursor: nextCursor,
    });

    images.push(...(response.resources || []));
    nextCursor = response.next_cursor;
  } while (nextCursor);

  return images;
}

/**
 * Recupere toutes les URLs d'images deja rattachees a un produit existant,
 * pour rendre le script rejouable sans creer de doublons.
 */
async function getKnownImageUrls() {
  const products = await Product.find({}, 'mainImage images').lean();
  const known = new Set();

  for (const product of products) {
    if (product.mainImage) known.add(product.mainImage);
    for (const image of product.images || []) known.add(image);
  }

  return known;
}

async function restore() {
  const args = parseArgs(process.argv.slice(2));
  checkEnv();

  await mongoose.connect(config.mongodbUri);
  console.log('Connecte a MongoDB');

  // 1. Lister les images disponibles sur Cloudinary
  const collected = [];
  for (const prefix of CLOUDINARY_PREFIXES) {
    const images = await listImages(prefix);
    console.log(`  ${prefix} : ${images.length} image(s)`);
    collected.push(...images);
  }

  if (collected.length === 0) {
    console.log('\nAucune image trouvee sur Cloudinary. Rien a restaurer.');
    await mongoose.disconnect();
    return;
  }

  // 2. Trier par date d'upload : l'ordre de creation d'origine du catalogue
  collected.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // 3. Ignorer les images deja rattachees a un produit
  const knownUrls = await getKnownImageUrls();
  const orphans = collected.filter((image) => !knownUrls.has(image.secure_url));

  console.log(
    `\n${collected.length} image(s) au total, ${collected.length - orphans.length} deja rattachee(s) a un produit.`
  );

  if (orphans.length === 0) {
    console.log('Toutes les images sont deja utilisees. Rien a restaurer.');
    await mongoose.disconnect();
    return;
  }

  // 4. Regrouper les images envoyees ensemble, puis construire un brouillon par groupe
  const groups = groupImagesByUploadTime(orphans, args.groupWindow);

  if (args.groupWindow > 0) {
    console.log(
      `Regroupement des images envoyees a moins de ${args.groupWindow}s d'intervalle ` +
      `(max ${MAX_IMAGES_PER_PRODUCT} par produit) : ${groups.length} produit(s) pour ${orphans.length} image(s).`
    );
    console.log('Utilisez --no-group pour creer une fiche par image, ou --group-window=<secondes> pour ajuster.');
  }

  const existingCount = await Product.countDocuments();
  const drafts = groups.map((group, index) => ({
    name: `Produit a completer ${existingCount + index + 1}`,
    category: args.category,
    basePrice: args.price,
    mainImage: group[0].secure_url,
    images: group.map((image) => image.secure_url),
    description:
      `Fiche restauree automatiquement depuis Cloudinary (${group.map((i) => i.public_id).join(', ')}). ` +
      'A completer avant publication.',
    isActive: false,
  }));

  console.log(`\n${drafts.length} produit(s) brouillon(s) a creer :\n`);
  for (const draft of drafts.slice(0, 10)) {
    const imageCount = draft.images.length === 1 ? '1 image ' : `${draft.images.length} images`;
    console.log(`  - ${draft.name.padEnd(28)} ${imageCount}  ${draft.mainImage}`);
  }
  if (drafts.length > 10) {
    console.log(`  ... et ${drafts.length - 10} autre(s)`);
  }

  if (!args.apply) {
    console.log(
      '\n[SIMULATION] Aucune ecriture effectuee.' +
      '\nRelancez avec --apply pour creer reellement les produits.'
    );
    await mongoose.disconnect();
    return;
  }

  // 5. Creation (une par une : le hook pre-save genere le slug)
  let created = 0;
  const failures = [];

  for (const draft of drafts) {
    try {
      await Product.create(draft);
      created += 1;
    } catch (error) {
      failures.push({ name: draft.name, message: error.message });
    }
  }

  console.log(`\n${created} produit(s) cree(s) en brouillon (isActive: false).`);

  if (failures.length > 0) {
    console.log(`${failures.length} echec(s) :`);
    for (const failure of failures) {
      console.log(`  - ${failure.name} : ${failure.message}`);
    }
  }

  console.log(
    '\nProchaine etape : ouvrez /admin/products pour renseigner nom, prix,' +
    '\ncategorie et description, puis activez les fiches a publier.'
  );

  await mongoose.disconnect();
}

restore().catch(async (error) => {
  console.error(`\nErreur : ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
