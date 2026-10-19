const ExcelJS = require('exceljs');
const { Prisma } = require('@prisma/client');

const { prisma } = require('../../config/prisma');
const { toNumber } = require('../../utils/serialize');

/**
 * Utilitaire pour creer un workbook avec un style coherent
 */
const createWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ibag Couture';
  workbook.created = new Date();
  return workbook;
};

const styleHeaders = (sheet) => {
  const headerRow = sheet.getRow(1);
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1C1917' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;
};

const sendWorkbook = async (res, workbook, filename) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};

const today = () => new Date().toISOString().split('T')[0];
const frenchDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '');

const dateRange = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return undefined;
  const range = {};
  if (dateFrom) range.gte = new Date(dateFrom);
  if (dateTo) range.lte = new Date(dateTo);
  return range;
};

/**
 * @desc    Export clients
 * @route   GET /api/exports/clients
 */
const exportClients = async (req, res, next) => {
  try {
    const { clientType } = req.query;
    const where = {};
    if (clientType && clientType !== 'tous') where.clientType = clientType;

    const clients = await prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } });

    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet('Clients');

    sheet.columns = [
      { header: 'Nom complet', key: 'fullName', width: 25 },
      { header: 'Téléphone', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Type', key: 'clientType', width: 12 },
      { header: 'Adresse', key: 'address', width: 30 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Date ajout', key: 'createdAt', width: 14 },
    ];

    styleHeaders(sheet);

    for (const client of clients) {
      sheet.addRow({
        fullName: client.fullName,
        phone: client.phone,
        email: client.email || '',
        clientType: client.clientType === 'sur_place' ? 'Sur place' : 'En ligne',
        address: client.address || '',
        notes: client.notes || '',
        createdAt: frenchDate(client.createdAt),
      });
    }

    await sendWorkbook(res, workbook, `clients-ibag-${today()}.xlsx`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export mesures clients
 * @route   GET /api/exports/measurements
 */
const exportMeasurements = async (req, res, next) => {
  try {
    const { clientType } = req.query;

    // Colonne Json nullable : l'absence de mesures est un NULL SQL, que Prisma
    // designe par Prisma.DbNull.
    const where = { measurements: { not: Prisma.DbNull } };
    if (clientType && clientType !== 'tous') where.clientType = clientType;

    const clients = await prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } });

    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet('Mesures');

    sheet.columns = [
      { header: 'Client', key: 'fullName', width: 25 },
      { header: 'Téléphone', key: 'phone', width: 18 },
      { header: 'Épaules', key: 'shoulders', width: 10 },
      { header: 'Poitrine', key: 'chest', width: 10 },
      { header: 'Taille', key: 'waist', width: 10 },
      { header: 'Hanches', key: 'hips', width: 10 },
      { header: 'Long. boubou', key: 'boubouLength', width: 14 },
      { header: 'Long. pantalon', key: 'pantsLength', width: 14 },
      { header: 'Long. manche', key: 'sleeveLength', width: 14 },
      { header: 'Notes mesures', key: 'measNotes', width: 25 },
    ];

    styleHeaders(sheet);

    for (const client of clients) {
      const m = client.measurements || {};
      sheet.addRow({
        fullName: client.fullName,
        phone: client.phone,
        shoulders: m.shoulders || '',
        chest: m.chest || '',
        waist: m.waist || '',
        hips: m.hips || '',
        boubouLength: m.boubouLength || '',
        pantsLength: m.pantsLength || '',
        sleeveLength: m.sleeveLength || '',
        measNotes: m.notes || '',
      });
    }

    await sendWorkbook(res, workbook, `mesures-ibag-${today()}.xlsx`);
  } catch (error) {
    next(error);
  }
};

const STATUS_LABELS = {
  pending: 'En attente',
  in_production: 'En confection',
  ready: 'Prêt',
  delivered: 'Livré',
  cancelled: 'Annulé',
};

const PAYMENT_LABELS = {
  non_paye: 'Non payé',
  acompte: 'Acompte',
  paye: 'Payé',
  rembourse: 'Remboursé',
};

const METHOD_LABELS = {
  especes: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  autre: 'Autre',
};

/**
 * @desc    Export commandes
 * @route   GET /api/exports/orders
 */
const exportOrders = async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo } = req.query;

    const where = {};
    if (status) where.status = status;
    const createdAt = dateRange(dateFrom, dateTo);
    if (createdAt) where.createdAt = createdAt;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, category: true } },
        client: { select: { fullName: true, phone: true } },
      },
    });

    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet('Commandes');

    sheet.columns = [
      { header: 'N° Commande', key: 'orderNumber', width: 16 },
      { header: 'Client', key: 'clientName', width: 22 },
      { header: 'Téléphone', key: 'phone', width: 18 },
      { header: 'Produit', key: 'product', width: 22 },
      { header: 'Taille', key: 'size', width: 12 },
      { header: 'Prix total', key: 'totalPrice', width: 14 },
      { header: 'Statut', key: 'status', width: 14 },
      { header: 'Paiement', key: 'paymentStatus', width: 14 },
      { header: 'Date', key: 'createdAt', width: 14 },
    ];

    styleHeaders(sheet);

    for (const order of orders) {
      sheet.addRow({
        orderNumber: order.orderNumber,
        clientName: order.customer?.fullName || order.client?.fullName || '',
        phone: order.customer?.phone || order.client?.phone || '',
        // Le snapshot prend le relais si le produit a ete supprime.
        product: order.product?.name || order.productSnapshot?.name || '',
        size: order.size,
        totalPrice: toNumber(order.totalPrice),
        status: STATUS_LABELS[order.status] || order.status,
        paymentStatus: PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus,
        createdAt: frenchDate(order.createdAt),
      });
    }

    sheet.getColumn('totalPrice').numFmt = '#,##0 "FCFA"';

    await sendWorkbook(res, workbook, `commandes-ibag-${today()}.xlsx`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export paiements
 * @route   GET /api/exports/payments
 */
const exportPayments = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, paymentMethod } = req.query;

    const where = {};
    if (paymentMethod) where.paymentMethod = paymentMethod;
    const paymentDate = dateRange(dateFrom, dateTo);
    if (paymentDate) where.paymentDate = paymentDate;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        order: { select: { orderNumber: true, totalPrice: true, customer: true } },
        client: { select: { fullName: true, phone: true } },
      },
    });

    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet('Paiements');

    sheet.columns = [
      { header: 'N° Commande', key: 'orderNumber', width: 16 },
      { header: 'Client', key: 'clientName', width: 22 },
      { header: 'Montant', key: 'amount', width: 14 },
      { header: 'Méthode', key: 'method', width: 14 },
      { header: 'Date paiement', key: 'paymentDate', width: 14 },
      { header: 'Notes', key: 'notes', width: 25 },
    ];

    styleHeaders(sheet);

    for (const payment of payments) {
      sheet.addRow({
        orderNumber: payment.order?.orderNumber || '',
        clientName: payment.client?.fullName || payment.order?.customer?.fullName || '',
        amount: toNumber(payment.amount),
        method: METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod,
        paymentDate: frenchDate(payment.paymentDate),
        notes: payment.notes || '',
      });
    }

    sheet.getColumn('amount').numFmt = '#,##0 "FCFA"';

    await sendWorkbook(res, workbook, `paiements-ibag-${today()}.xlsx`);
  } catch (error) {
    next(error);
  }
};

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/**
 * @desc    Export bilan financier
 * @route   GET /api/exports/finances
 */
const exportFinances = async (req, res, next) => {
  try {
    const currentYear = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear + 1, 0, 1);

    const [orders, payments] = await Promise.all([
      prisma.order.findMany({
        where: { status: { not: 'cancelled' }, createdAt: { gte: start, lt: end } },
        select: { createdAt: true, totalPrice: true },
      }),
      prisma.payment.findMany({
        where: { paymentDate: { gte: start, lt: end } },
        select: { paymentDate: true, amount: true },
      }),
    ]);

    // Regroupement par mois : le volume est borne a une annee de commandes.
    const byMonth = Array.from({ length: 12 }, () => ({ revenue: 0, count: 0, collected: 0 }));

    for (const order of orders) {
      const bucket = byMonth[order.createdAt.getMonth()];
      bucket.revenue += toNumber(order.totalPrice) || 0;
      bucket.count += 1;
    }
    for (const payment of payments) {
      byMonth[payment.paymentDate.getMonth()].collected += toNumber(payment.amount) || 0;
    }

    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet(`Bilan ${currentYear}`);

    sheet.columns = [
      { header: 'Mois', key: 'month', width: 14 },
      { header: 'Commandes', key: 'count', width: 12 },
      { header: 'CA Total', key: 'revenue', width: 16 },
      { header: 'Encaissé', key: 'collected', width: 16 },
      { header: 'Restant', key: 'remaining', width: 16 },
    ];

    styleHeaders(sheet);

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalCount = 0;

    byMonth.forEach((bucket, index) => {
      totalRevenue += bucket.revenue;
      totalCollected += bucket.collected;
      totalCount += bucket.count;

      sheet.addRow({
        month: MONTH_NAMES[index],
        count: bucket.count,
        revenue: bucket.revenue,
        collected: bucket.collected,
        remaining: bucket.revenue - bucket.collected,
      });
    });

    const totalRow = sheet.addRow({
      month: 'TOTAL',
      count: totalCount,
      revenue: totalRevenue,
      collected: totalCollected,
      remaining: totalRevenue - totalCollected,
    });
    totalRow.font = { bold: true };

    for (const key of ['revenue', 'collected', 'remaining']) {
      sheet.getColumn(key).numFmt = '#,##0 "FCFA"';
    }

    await sendWorkbook(res, workbook, `bilan-financier-${currentYear}.xlsx`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportClients,
  exportMeasurements,
  exportOrders,
  exportPayments,
  exportFinances,
};
