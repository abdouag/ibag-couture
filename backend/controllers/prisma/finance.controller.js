const { prisma } = require('../../config/prisma');
const { serializeOrder, serializeMany, toNumber } = require('../../utils/serialize');

/**
 * Construit un filtre de dates Prisma a partir des parametres de requete.
 */
const dateRange = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return undefined;

  const range = {};
  if (dateFrom) range.gte = new Date(dateFrom);
  if (dateTo) range.lte = new Date(dateTo);
  return range;
};

/**
 * @desc    Resume financier global
 * @route   GET /api/finances/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const orderWhere = { status: { not: 'cancelled' } };
    const createdAt = dateRange(dateFrom, dateTo);
    if (createdAt) orderWhere.createdAt = createdAt;

    const paymentWhere = {};
    const paymentDate = dateRange(dateFrom, dateTo);
    if (paymentDate) paymentWhere.paymentDate = paymentDate;

    const [revenue, collected, statusCounts] = await Promise.all([
      prisma.order.aggregate({
        where: orderWhere,
        _sum: { totalPrice: true },
        _count: { _all: true },
      }),
      prisma.payment.aggregate({ where: paymentWhere, _sum: { amount: true } }),
      prisma.order.groupBy({
        by: ['paymentStatus'],
        where: orderWhere,
        _count: { _all: true },
      }),
    ]);

    const totalRevenue = toNumber(revenue._sum.totalPrice) || 0;
    const totalCollected = toNumber(collected._sum.amount) || 0;

    const countByStatus = {};
    for (const row of statusCounts) {
      countByStatus[row.paymentStatus] = row._count._all;
    }

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalCollected,
        totalRemaining: Math.max(0, totalRevenue - totalCollected),
        ordersCount: revenue._count._all,
        paidOrdersCount: countByStatus.paye || 0,
        partialOrdersCount: countByStatus.acompte || 0,
        unpaidOrdersCount: countByStatus.non_paye || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Chiffre d'affaires par periode
 * @route   GET /api/finances/revenue
 *
 * Le pipeline d'agregation MongoDB par annee/mois/jour est remplace par un
 * regroupement SQL via date_trunc, qui fait le meme travail en une requete.
 */
const getRevenue = async (req, res, next) => {
  try {
    const { period = 'monthly', year, month } = req.query;

    const currentYear = parseInt(year, 10) || new Date().getFullYear();
    const isDaily = period === 'daily' && month;

    const start = isDaily
      ? new Date(currentYear, parseInt(month, 10) - 1, 1)
      : new Date(currentYear, 0, 1);
    const end = isDaily
      ? new Date(currentYear, parseInt(month, 10), 1)
      : new Date(currentYear + 1, 0, 1);

    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: start, lt: end },
      },
      select: { createdAt: true, totalPrice: true },
    });

    // Regroupement en memoire : le volume est borne par la periode demandee
    // (un mois ou une annee de commandes), et cela evite une requete brute qui
    // contournerait le typage de Prisma.
    const buckets = new Map();

    for (const order of orders) {
      const date = order.createdAt;
      const key = isDaily
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const bucket = buckets.get(key) || { date: key, revenue: 0, count: 0 };
      bucket.revenue += toNumber(order.totalPrice) || 0;
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    const data = [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const METHOD_LABELS = {
  especes: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  autre: 'Autre',
};

/**
 * @desc    Repartition par methode de paiement
 * @route   GET /api/finances/by-method
 */
const getByMethod = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const where = {};
    const paymentDate = dateRange(dateFrom, dateTo);
    if (paymentDate) where.paymentDate = paymentDate;

    const results = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { amount: true },
      _count: { _all: true },
    });

    const data = results
      .map((row) => ({
        method: row.paymentMethod,
        label: METHOD_LABELS[row.paymentMethod] || row.paymentMethod,
        total: toNumber(row._sum.amount) || 0,
        count: row._count._all,
      }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json({ success: true, data });
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
    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'cancelled' },
        paymentStatus: { in: ['non_paye', 'acompte'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, slug: true, category: true } },
        client: { select: { id: true, fullName: true, phone: true } },
      },
    });

    const paidByOrder = {};
    if (orders.length > 0) {
      const payments = await prisma.payment.groupBy({
        by: ['orderId'],
        where: { orderId: { in: orders.map((order) => order.id) } },
        _sum: { amount: true },
      });

      for (const row of payments) {
        paidByOrder[row.orderId] = toNumber(row._sum.amount) || 0;
      }
    }

    const data = serializeMany(serializeOrder, orders).map((order) => {
      const amountPaid = paidByOrder[order._id] || 0;
      return { ...order, amountPaid, remainingAmount: order.totalPrice - amountPaid };
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getRevenue, getByMethod, getOutstanding };
