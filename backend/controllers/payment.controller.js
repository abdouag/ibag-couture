const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { AppError } = require('../middleware');

/**
 * Recalcule et synchronise le paymentStatus d'une commande
 * en fonction de la somme de ses paiements.
 */
const recalcPaymentStatus = async (orderId) => {
  const result = await Payment.aggregate([
    { $match: { order: orderId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const amountPaid = result[0]?.total || 0;
  const order = await Order.findById(orderId);
  if (!order) return;

  let paymentStatus = 'non_paye';
  if (amountPaid >= order.totalPrice) {
    paymentStatus = 'paye';
  } else if (amountPaid > 0) {
    paymentStatus = 'acompte';
  }

  await Order.findByIdAndUpdate(orderId, { paymentStatus });
};

/**
 * @desc    Enregistrer un paiement
 * @route   POST /api/payments
 */
const createPayment = async (req, res, next) => {
  try {
    const { order: orderId, client, amount, paymentMethod, paymentDate, notes } = req.body;

    // Vérifier que la commande existe
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Commande non trouvée', 404));
    }

    const payment = await Payment.create({
      order: orderId,
      client: client || undefined,
      amount,
      paymentMethod,
      paymentDate: paymentDate || Date.now(),
      notes: notes || undefined,
    });

    // Synchroniser le statut de paiement de la commande
    await recalcPaymentStatus(order._id);

    res.status(201).json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: payment,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    if (error.name === 'CastError') {
      return next(new AppError('ID invalide', 400));
    }
    next(error);
  }
};

/**
 * @desc    Lister les paiements
 * @route   GET /api/payments
 */
const getAllPayments = async (req, res, next) => {
  try {
    const {
      order,
      client,
      paymentMethod,
      dateFrom,
      dateTo,
      sort = '-paymentDate',
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (order) filter.order = order;
    if (client) filter.client = client;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) filter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.paymentDate.$lte = new Date(dateTo);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('order', 'orderNumber totalPrice customer')
        .populate('client', 'fullName phone')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Paiements récupérés avec succès',
      count: payments.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Détail d'un paiement
 * @route   GET /api/payments/:id
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber totalPrice customer')
      .populate('client', 'fullName phone')
      .lean();

    if (!payment) {
      return next(new AppError('Paiement non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de paiement invalide', 400));
    }
    next(error);
  }
};

/**
 * @desc    Supprimer un paiement
 * @route   DELETE /api/payments/:id
 */
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return next(new AppError('Paiement non trouvé', 404));
    }

    const orderId = payment.order;
    await Payment.findByIdAndDelete(req.params.id);

    // Recalculer le statut de paiement
    await recalcPaymentStatus(orderId);

    res.status(200).json({
      success: true,
      message: 'Paiement supprimé avec succès',
      data: null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de paiement invalide', 400));
    }
    next(error);
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  deletePayment,
};
