const { prisma } = require('../../config/prisma');
const { AppError } = require('../../middleware');
const { serializePayment, serializeMany, toNumber } = require('../../utils/serialize');
const { parseSort, parsePagination, paginated } = require('../../utils/query');

const SORTABLE_FIELDS = ['paymentDate', 'createdAt', 'amount', 'paymentMethod'];

/**
 * Recalcule et synchronise le statut de paiement d'une commande en fonction de
 * la somme de ses paiements.
 *
 * Appele apres chaque creation ou suppression de paiement : le statut n'est
 * jamais saisi a la main, il decoule toujours des encaissements enregistres.
 */
const recalcPaymentStatus = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, totalPrice: true },
  });
  if (!order) return;

  const aggregate = await prisma.payment.aggregate({
    where: { orderId },
    _sum: { amount: true },
  });

  const amountPaid = toNumber(aggregate._sum.amount) || 0;
  const totalPrice = toNumber(order.totalPrice);

  let paymentStatus = 'non_paye';
  if (amountPaid >= totalPrice) {
    paymentStatus = 'paye';
  } else if (amountPaid > 0) {
    paymentStatus = 'acompte';
  }

  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus } });
};

/**
 * @desc    Enregistrer un paiement
 * @route   POST /api/payments
 */
const createPayment = async (req, res, next) => {
  try {
    const { order: orderId, client, amount, paymentMethod, paymentDate, notes } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return next(new AppError('Commande non trouvée', 404));
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        clientId: client || null,
        amount,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes: notes || null,
      },
    });

    await recalcPaymentStatus(orderId);

    res.status(201).json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: serializePayment(payment),
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return next(new AppError('Commande ou client introuvable', 404));
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
    const { order, client, paymentMethod, dateFrom, dateTo, sort = '-paymentDate' } = req.query;
    const { pageNum, limitNum, skip } = parsePagination({ ...req.query, limit: req.query.limit || 50 });

    const where = {};
    if (order) where.orderId = order;
    if (client) where.clientId = client;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = new Date(dateFrom);
      if (dateTo) where.paymentDate.lte = new Date(dateTo);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: parseSort(sort, SORTABLE_FIELDS, { paymentDate: 'desc' }),
        skip,
        take: limitNum,
        include: {
          order: { select: { id: true, orderNumber: true, totalPrice: true, customer: true } },
          client: { select: { id: true, fullName: true, phone: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    paginated(res, {
      message: 'Paiements récupérés avec succès',
      data: serializeMany(serializePayment, payments),
      total,
      pageNum,
      limitNum,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Detail d'un paiement
 * @route   GET /api/payments/:id
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        order: { select: { id: true, orderNumber: true, totalPrice: true, customer: true } },
        client: { select: { id: true, fullName: true, phone: true } },
      },
    });

    if (!payment) {
      return next(new AppError('Paiement non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      data: serializePayment(payment),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un paiement
 * @route   DELETE /api/payments/:id
 */
const deletePayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) {
      return next(new AppError('Paiement non trouvé', 404));
    }

    await prisma.payment.delete({ where: { id: req.params.id } });

    // Le statut de la commande doit refleter la disparition de l'encaissement.
    await recalcPaymentStatus(payment.orderId);

    res.status(200).json({
      success: true,
      message: 'Paiement supprimé avec succès',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recalcPaymentStatus,
  createPayment,
  getAllPayments,
  getPaymentById,
  deletePayment,
};
