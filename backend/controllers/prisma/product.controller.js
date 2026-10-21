const { prisma } = require('../../config/prisma');
const { AppError } = require('../../middleware');
const { serializeProduct, serializeMany } = require('../../utils/serialize');
const { slugify } = require('../../utils/slug');

/**
 * Champs modifiables par l'API. Tout autre champ present dans le corps de la
 * requete est ignore : avec Mongoose, `req.body` etait passe tel quel a
 * `create()` et `findByIdAndUpdate()`, ce qui laissait la porte ouverte a
 * l'ecriture de champs non prevus.
 */
const WRITABLE_FIELDS = [
  'name',
  'category',
  'basePrice',
  'promoPrice',
  'mainImage',
  'images',
  'availableSizes',
  'isCustomAvailable',
  'customPriceImpact',
  'options',
  'description',
  'productionTime',
  'hasStock',
  'stockQuantity',
  'isActive',
];

const pickWritable = (body) => {
  const data = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
};

/**
 * @desc    Creer un nouveau produit
 * @route   POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const data = pickWritable(req.body);
    data.slug = slugify(data.name);

    const product = await prisma.product.create({ data });

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: serializeProduct(product),
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new AppError('Un produit avec ce nom existe déjà', 400));
    }
    next(error);
  }
};

/**
 * Score un produit pour le tri intelligent de la page d'accueil et du
 * catalogue. Reprend la ponderation existante : meilleures ventes, promotions,
 * nouveautes, presence d'image, et une rotation quotidienne pour que l'ordre
 * change chaque jour sans etre aleatoire a chaque rechargement.
 */
const buildScorer = (orderCountByProduct, daySeed) => {
  const counts = Object.values(orderCountByProduct);
  const maxOrders = Math.max(1, ...counts);
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const seededRandom = (id) => {
    let hash = daySeed;
    for (let i = 0; i < id.length; i += 1) {
      hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    }
    return ((hash & 0x7fffffff) % 1000) / 1000;
  };

  return (product) => {
    const orders = orderCountByProduct[product._id] || 0;

    const sellerScore = (orders / maxOrders) * 30;
    const promoScore =
      product.promoPrice != null && product.promoPrice < product.basePrice ? 20 : 0;
    const age = now - new Date(product.createdAt).getTime();
    const recencyScore = Math.max(0, 1 - age / thirtyDays) * 15;
    const hasImage = product.mainImage || (product.images && product.images.length > 0);
    const imageScore = hasImage ? 10 : 0;
    const rotationScore = seededRandom(product._id) * 25;

    return sellerScore + promoScore + recencyScore + imageScore + rotationScore;
  };
};

/**
 * Repartit les produits pour eviter d'afficher plusieurs articles de la meme
 * categorie a la suite.
 */
const diversifyByCategory = (scored) => {
  const diversified = [];
  const remaining = [...scored];
  const seen = {};

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestCount = Infinity;

    for (let i = 0; i < Math.min(remaining.length, 8); i += 1) {
      const category = remaining[i].category || '';
      const count = seen[category] || 0;
      if (count < bestCount) {
        bestCount = count;
        bestIdx = i;
      }
    }

    const picked = remaining.splice(bestIdx, 1)[0];
    seen[picked.category || ''] = (seen[picked.category || ''] || 0) + 1;
    diversified.push(picked);
  }

  return diversified;
};

/**
 * @desc    Recuperer tous les produits
 * @route   GET /api/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { category, isActive, search, sort, page = 1, limit = 10 } = req.query;

    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    // L'index texte MongoDB est remplace par une recherche insensible a la
    // casse sur le nom et la description, suffisante a l'echelle du catalogue.
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const respond = (products, total) =>
      res.status(200).json({
        success: true,
        message: 'Produits récupérés avec succès',
        count: products.length,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        data: products,
      });

    // Tri explicite demande : pagination directe en base.
    if (sort) {
      const direction = sort.startsWith('-') ? 'desc' : 'asc';
      const field = sort.replace(/^-/, '');
      const orderBy = WRITABLE_FIELDS.includes(field) || field === 'createdAt'
        ? { [field]: direction }
        : { createdAt: 'desc' };

      const [rows, total] = await Promise.all([
        prisma.product.findMany({ where, orderBy, skip, take: limitNum }),
        prisma.product.count({ where }),
      ]);

      return respond(serializeMany(serializeProduct, rows), total);
    }

    // Tri intelligent : ventes, promotions, nouveautes, diversite, rotation.
    const [rows, total, orderCounts] = await Promise.all([
      prisma.product.findMany({ where }),
      prisma.product.count({ where }),
      prisma.order.groupBy({
        by: ['productId'],
        where: { status: { not: 'cancelled' }, productId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const orderCountByProduct = {};
    for (const row of orderCounts) {
      orderCountByProduct[row.productId] = row._count._all;
    }

    const today = new Date();
    const daySeed =
      today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const score = buildScorer(orderCountByProduct, daySeed);

    const products = serializeMany(serializeProduct, rows)
      .map((product) => ({ product, score: score(product) }))
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);

    const paginated = diversifyByCategory(products).slice(skip, skip + limitNum);

    return respond(paginated, total);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recuperer un produit par son slug
 * @route   GET /api/products/:slug
 */
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });

    if (!product) {
      return next(new AppError('Produit non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Produit récupéré avec succès',
      data: serializeProduct(product),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre a jour un produit
 * @route   PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const data = pickWritable(req.body);

    // Renommer un produit regenere son slug, ce que l'implementation Mongoose
    // ne faisait pas : le hook de generation ne s'executait pas sur une mise
    // a jour, et l'URL restait figee sur l'ancien nom.
    if (data.name !== undefined) {
      data.slug = slugify(data.name);
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data: serializeProduct(product),
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new AppError('Un produit avec ce nom existe déjà', 400));
    }
    if (error.code === 'P2025') {
      return next(new AppError('Produit non trouvé', 404));
    }
    next(error);
  }
};

/**
 * @desc    Supprimer un produit
 * @route   DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });

    res.status(200).json({
      success: true,
      message: 'Produit supprimé avec succès',
      data: null,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Produit non trouvé', 404));
    }
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};
