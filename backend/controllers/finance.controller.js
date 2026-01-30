const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

/**
 * @desc    Résumé financier global
 * @route   GET /api/finances/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const orderFilter = {};
    if (dateFrom || dateTo) {
      orderFilter.createdAt = {};
      if (dateFrom) orderFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) orderFilter.createdAt.$lte = new Date(dateTo);
    }

    // Total CA (toutes commandes sauf annulées)
    const revenueResult = await Order.aggregate([
      { $match: { ...orderFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          ordersCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const ordersCount = revenueResult[0]?.ordersCount || 0;

    // Total encaissé (somme de tous les paiements)
    const paymentFilter = {};
    if (dateFrom || dateTo) {
      paymentFilter.paymentDate = {};
      if (dateFrom) paymentFilter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) paymentFilter.paymentDate.$lte = new Date(dateTo);
    }

    const collectedResult = await Payment.aggregate([
      { $match: paymentFilter },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } },
    ]);

    const totalCollected = collectedResult[0]?.totalCollected || 0;
    const totalRemaining = totalRevenue - totalCollected;

    // Comptage par statut de paiement
    const statusCounts = await Order.aggregate([
      { $match: { ...orderFilter, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]);

    const statusMap = {};
    statusCounts.forEach(({ _id, count }) => {
      statusMap[_id] = count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalCollected,
        totalRemaining: Math.max(0, totalRemaining),
        ordersCount,
        paidOrdersCount: (statusMap.paye || 0) + (statusMap.paid || 0),
        partialOrdersCount: statusMap.acompte || 0,
        unpaidOrdersCount: (statusMap.non_paye || 0) + (statusMap.unpaid || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Chiffre d'affaires par période
 * @route   GET /api/finances/revenue
 */
const getRevenue = async (req, res, next) => {
  try {
    const { period = 'monthly', year, month } = req.query;

    const currentYear = parseInt(year) || new Date().getFullYear();
    const match = { status: { $ne: 'cancelled' } };

    let groupId;
    let dateFilter;

    if (period === 'daily' && month) {
      const currentMonth = parseInt(month);
      dateFilter = {
        createdAt: {
          $gte: new Date(currentYear, currentMonth - 1, 1),
          $lt: new Date(currentYear, currentMonth, 1),
        },
      };
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    } else {
      dateFilter = {
        createdAt: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1),
        },
      };
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    }

    const pipeline = [
      { $match: { ...match, ...dateFilter } },
      {
        $group: {
          _id: groupId,
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ];

    const results = await Order.aggregate(pipeline);

    const data = results.map((r) => ({
      date: period === 'daily'
        ? `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`
        : `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
      revenue: r.revenue,
      count: r.count,
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Répartition par méthode de paiement
 * @route   GET /api/finances/by-method
 */
const getByMethod = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const filter = {};
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) filter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.paymentDate.$lte = new Date(dateTo);
    }

    const results = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const methodLabels = {
      especes: 'Espèces',
      wave: 'Wave',
      orange_money: 'Orange Money',
      autre: 'Autre',
    };

    const data = results.map((r) => ({
      method: r._id,
      label: methodLabels[r._id] || r._id,
      total: r.total,
      count: r.count,
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Commandes avec solde restant
 * @route   GET /api/finances/outstanding
 */
const getOutstanding = async (req, res, next) => {
  try {
    // Commandes non payées ou partiellement payées, non annulées
    const orders = await Order.find({
      status: { $ne: 'cancelled' },
      paymentStatus: { $in: ['non_paye', 'acompte', 'unpaid'] },
    })
      .populate('product', 'name slug category')
      .populate('client', 'fullName phone')
      .sort('-createdAt')
      .lean();

    // Récupérer les paiements pour chaque commande
    const orderIds = orders.map((o) => o._id);
    const payments = await Payment.aggregate([
      { $match: { order: { $in: orderIds } } },
      { $group: { _id: '$order', amountPaid: { $sum: '$amount' } } },
    ]);

    const paidMap = {};
    payments.forEach(({ _id, amountPaid }) => {
      paidMap[_id.toString()] = amountPaid;
    });

    const data = orders.map((order) => ({
      ...order,
      amountPaid: paidMap[order._id.toString()] || 0,
      remainingAmount: order.totalPrice - (paidMap[order._id.toString()] || 0),
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getRevenue,
  getByMethod,
  getOutstanding,
};
