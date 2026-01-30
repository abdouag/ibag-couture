const ExcelJS = require('exceljs');
const Client = require('../models/Client');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

/**
 * Utilitaire pour créer un workbook avec un style cohérent
 */
const createWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ibag Couture';
  workbook.created = new Date();
  return workbook;
};

const styleHeaders = (sheet) => {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
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
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};

/**
 * @desc    Export clients
 * @route   GET /api/exports/clients
 */
const exportClients = async (req, res, next) => {
  try {
    const { clientType } = req.query;
    const filter = {};
    if (clientType && clientType !== 'tous') filter.clientType = clientType;

    const clients = await Client.find(filter).sort('-createdAt').lean();

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

    clients.forEach((c) => {
      sheet.addRow({
        fullName: c.fullName,
        phone: c.phone,
        email: c.email || '',
        clientType: c.clientType === 'sur_place' ? 'Sur place' : 'En ligne',
        address: c.address || '',
        notes: c.notes || '',
        createdAt: new Date(c.createdAt).toLocaleDateString('fr-FR'),
      });
    });

    await sendWorkbook(res, workbook, `clients-ibag-${new Date().toISOString().split('T')[0]}.xlsx`);
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
    const filter = { measurements: { $ne: null } };
    if (clientType && clientType !== 'tous') filter.clientType = clientType;

    const clients = await Client.find(filter).sort('-createdAt').lean();

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

    clients.forEach((c) => {
      const m = c.measurements || {};
      sheet.addRow({
        fullName: c.fullName,
        phone: c.phone,
        shoulders: m.shoulders || '',
        chest: m.chest || '',
        waist: m.waist || '',
        hips: m.hips || '',
        boubouLength: m.boubouLength || '',
        pantsLength: m.pantsLength || '',
        sleeveLength: m.sleeveLength || '',
        measNotes: m.notes || '',
      });
    });

    await sendWorkbook(res, workbook, `mesures-ibag-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export commandes
 * @route   GET /api/exports/orders
 */
const exportOrders = async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(filter)
      .populate('product', 'name category')
      .populate('client', 'fullName phone')
      .sort('-createdAt')
      .lean();

    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet('Commandes');

    const statusLabels = {
      pending: 'En attente', in_production: 'En confection',
      ready: 'Prêt', delivered: 'Livré', cancelled: 'Annulé',
    };
    const paymentLabels = {
      non_paye: 'Non payé', acompte: 'Acompte', paye: 'Payé',
      rembourse: 'Remboursé', unpaid: 'Non payé', paid: 'Payé', refunded: 'Remboursé',
    };

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

    orders.forEach((o) => {
      sheet.addRow({
        orderNumber: o.orderNumber || o._id.toString().slice(-6).toUpperCase(),
        clientName: o.customer?.fullName || o.client?.fullName || '',
        phone: o.customer?.phone || o.client?.phone || '',
        product: o.product?.name || '',
        size: o.size,
        totalPrice: o.totalPrice,
        status: statusLabels[o.status] || o.status,
        paymentStatus: paymentLabels[o.paymentStatus] || o.paymentStatus,
        createdAt: new Date(o.createdAt).toLocaleDateString('fr-FR'),
      });
    });

    // Format nombre pour la colonne prix
    sheet.getColumn('totalPrice').numFmt = '#,##0 "FCFA"';

    await sendWorkbook(res, workbook, `commandes-ibag-${new Date().toISOString().split('T')[0]}.xlsx`);
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
    const filter = {};
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) filter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.paymentDate.$lte = new Date(dateTo);
    }

    const payments = await Payment.find(filter)
      .populate('order', 'orderNumber totalPrice customer')
      .populate('client', 'fullName phone')
      .sort('-paymentDate')
      .lean();

    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet('Paiements');

    const methodLabels = {
      especes: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', autre: 'Autre',
    };

    sheet.columns = [
      { header: 'N° Commande', key: 'orderNumber', width: 16 },
      { header: 'Client', key: 'clientName', width: 22 },
      { header: 'Montant', key: 'amount', width: 14 },
      { header: 'Méthode', key: 'method', width: 14 },
      { header: 'Date paiement', key: 'paymentDate', width: 14 },
      { header: 'Notes', key: 'notes', width: 25 },
    ];

    styleHeaders(sheet);

    payments.forEach((p) => {
      sheet.addRow({
        orderNumber: p.order?.orderNumber || '',
        clientName: p.client?.fullName || p.order?.customer?.fullName || '',
        amount: p.amount,
        method: methodLabels[p.paymentMethod] || p.paymentMethod,
        paymentDate: new Date(p.paymentDate).toLocaleDateString('fr-FR'),
        notes: p.notes || '',
      });
    });

    sheet.getColumn('amount').numFmt = '#,##0 "FCFA"';

    await sendWorkbook(res, workbook, `paiements-ibag-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export bilan financier
 * @route   GET /api/exports/finances
 */
const exportFinances = async (req, res, next) => {
  try {
    const { year } = req.query;
    const currentYear = parseInt(year) || new Date().getFullYear();

    // CA mensuel
    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Paiements mensuels
    const paymentsByMonth = await Payment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$paymentDate' } },
          collected: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];

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

    const revenueMap = {};
    revenueByMonth.forEach((r) => { revenueMap[r._id.month] = r; });
    const paymentMap = {};
    paymentsByMonth.forEach((p) => { paymentMap[p._id.month] = p; });

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalCount = 0;

    for (let m = 1; m <= 12; m++) {
      const rev = revenueMap[m]?.revenue || 0;
      const col = paymentMap[m]?.collected || 0;
      const cnt = revenueMap[m]?.count || 0;

      totalRevenue += rev;
      totalCollected += col;
      totalCount += cnt;

      sheet.addRow({
        month: monthNames[m - 1],
        count: cnt,
        revenue: rev,
        collected: col,
        remaining: rev - col,
      });
    }

    // Ligne totale
    const totalRow = sheet.addRow({
      month: 'TOTAL',
      count: totalCount,
      revenue: totalRevenue,
      collected: totalCollected,
      remaining: totalRevenue - totalCollected,
    });
    totalRow.font = { bold: true };

    ['revenue', 'collected', 'remaining'].forEach((key) => {
      sheet.getColumn(key).numFmt = '#,##0 "FCFA"';
    });

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
