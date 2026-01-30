const Client = require('../models/Client');
const Order = require('../models/Order');
const { AppError } = require('../middleware');

/**
 * @desc    Créer un client
 * @route   POST /api/clients
 */
const createClient = async (req, res, next) => {
  try {
    const client = await Client.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: client,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    next(error);
  }
};

/**
 * @desc    Récupérer tous les clients
 * @route   GET /api/clients
 */
const getAllClients = async (req, res, next) => {
  try {
    const {
      search,
      clientType,
      sort = '-createdAt',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (clientType) {
      filter.clientType = clientType;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Client.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Clients récupérés avec succès',
      count: clients.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer un client par ID
 * @route   GET /api/clients/:id
 */
const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id).lean();

    if (!client) {
      return next(new AppError('Client non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Client récupéré avec succès',
      data: client,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de client invalide', 400));
    }
    next(error);
  }
};

/**
 * @desc    Modifier un client
 * @route   PUT /api/clients/:id
 */
const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return next(new AppError('Client non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: client,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    if (error.name === 'CastError') {
      return next(new AppError('ID de client invalide', 400));
    }
    next(error);
  }
};

/**
 * @desc    Supprimer un client
 * @route   DELETE /api/clients/:id
 */
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return next(new AppError('Client non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Client supprimé avec succès',
      data: null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de client invalide', 400));
    }
    next(error);
  }
};

/**
 * @desc    Récupérer les commandes d'un client
 * @route   GET /api/clients/:id/orders
 */
const getClientOrders = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id).lean();
    if (!client) {
      return next(new AppError('Client non trouvé', 404));
    }

    const orders = await Order.find({ client: req.params.id })
      .populate('product', 'name slug category productionTime')
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Commandes du client récupérées',
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de client invalide', 400));
    }
    next(error);
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientOrders,
};
