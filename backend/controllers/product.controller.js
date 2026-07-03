const Product = require('../models/Product');
const Order = require('../models/Order');
const { AppError } = require('../middleware');

/**
 * @desc    Créer un nouveau produit
 * @route   POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Un produit avec ce nom existe déjà', 400));
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    next(error);
  }
};

/**
 * @desc    Récupérer tous les produits
 * @route   GET /api/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const {
      category,
      isActive,
      search,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Construction du filtre
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Si un tri custom est demande, utiliser le tri simple
    if (sort) {
      const [products, total] = await Promise.all([
        Product.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Product.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Produits récupérés avec succès',
        count: products.length,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        data: products,
      });
    }

    // Tri intelligent : best sellers > promo > recents > diversite > rotation
    const [allProducts, total, orderCounts] = await Promise.all([
      Product.find(filter).lean(),
      Product.countDocuments(filter),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled'] } } },
        { $group: { _id: '$product', orderCount: { $sum: 1 } } },
      ]),
    ]);

    // Map des ventes par produit
    const orderCountMap = {};
    orderCounts.forEach(({ _id, orderCount }) => {
      if (_id) orderCountMap[_id.toString()] = orderCount;
    });

    const maxOrders = Math.max(1, ...Object.values(orderCountMap), 0);
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Seed pseudo-aleatoire base sur le jour (rotation quotidienne)
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const seededRandom = (id) => {
      let hash = daySeed;
      for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
      }
      return ((hash & 0x7fffffff) % 1000) / 1000;
    };

    // Score chaque produit
    const scored = allProducts.map((product) => {
      const pid = product._id.toString();
      const orders = orderCountMap[pid] || 0;

      // Best sellers (0-30 points)
      const sellerScore = (orders / maxOrders) * 30;

      // Produits en promo (0 ou 20 points)
      const hasPromo = product.promoPrice && product.promoPrice < product.basePrice;
      const promoScore = hasPromo ? 20 : 0;

      // Recence (0-15 points, decroit sur 30 jours)
      const age = now - new Date(product.createdAt).getTime();
      const recencyScore = Math.max(0, (1 - age / thirtyDays)) * 15;

      // Produit avec image (0 ou 10 points) — priorise les produits visuels
      const hasImage = product.mainImage || (product.images && product.images.length > 0);
      const imageScore = hasImage ? 10 : 0;

      // Rotation quotidienne (0-25 points) — change l'ordre chaque jour
      const rotationScore = seededRandom(pid) * 25;

      return {
        ...product,
        _score: sellerScore + promoScore + recencyScore + imageScore + rotationScore,
        _category: (product.category || '').toLowerCase(),
      };
    });

    // Tri par score decroissant
    scored.sort((a, b) => b._score - a._score);

    // Diversite de categories : repartir les produits pour alterner les categories
    // On prend les top produits et on les rearrange pour eviter les clusters de meme categorie
    const diversified = [];
    const remaining = [...scored];
    const categorySeen = {};

    while (remaining.length > 0) {
      // Chercher le prochain produit dont la categorie a ete la moins representee
      let bestIdx = 0;
      let bestCatCount = Infinity;
      for (let i = 0; i < Math.min(remaining.length, 8); i++) {
        const catCount = categorySeen[remaining[i]._category] || 0;
        if (catCount < bestCatCount) {
          bestCatCount = catCount;
          bestIdx = i;
        }
      }
      const picked = remaining.splice(bestIdx, 1)[0];
      categorySeen[picked._category] = (categorySeen[picked._category] || 0) + 1;
      diversified.push(picked);
    }

    // Pagination et suppression des champs internes
    const paginated = diversified.slice(skip, skip + limitNum).map(({ _score, _category, ...product }) => product);

    res.status(200).json({
      success: true,
      message: 'Produits récupérés avec succès',
      count: paginated.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: paginated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer un produit par son slug
 * @route   GET /api/products/:slug
 */
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug }).lean();

    if (!product) {
      return next(new AppError('Produit non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Produit récupéré avec succès',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour un produit
 * @route   PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return next(new AppError('Produit non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Un produit avec ce nom existe déjà', 400));
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    if (error.name === 'CastError') {
      return next(new AppError('ID de produit invalide', 400));
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
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return next(new AppError('Produit non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Produit supprimé avec succès',
      data: null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de produit invalide', 400));
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
