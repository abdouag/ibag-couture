const Product = require('../models/Product');
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
      sort = '-createdAt',
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
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Exécution des requêtes en parallèle
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Produits récupérés avec succès',
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: products,
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
