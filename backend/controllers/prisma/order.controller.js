const jwt = require('jsonwebtoken');

const { prisma } = require('../../config/prisma');
const { AppError } = require('../../middleware');
const config = require('../../config');
const { serializeOrder, serializeMany, toNumber } = require('../../utils/serialize');
const { parseSort, parsePagination, paginated } = require('../../utils/query');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../../services/emailService');

const VALID_STATUSES = ['pending', 'in_production', 'ready', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['non_paye', 'acompte', 'paye', 'rembourse'];
const VALID_WORKSHOP_STATUSES = ['en_attente', 'en_cours', 'retouche', 'pret', 'livre'];

const SORTABLE_FIELDS = [
  'createdAt',
  'updatedAt',
  'orderNumber',
  'totalPrice',
  'status',
  'paymentStatus',
  'expectedDeliveryDate',
  'workshopStatus',
];

const PRODUCT_SUMMARY = {
  select: {
    id: true,
    name: true,
    slug: true,
    category: true,
    mainImage: true,
    productionTime: true,
  },
};

/**
 * Genere le numero de commande de l'annee en cours.
 *
 * L'implementation MongoDB comptait tous les documents et ajoutait 1 : deux
 * commandes simultanees obtenaient le meme numero, et l'index unique faisait
 * echouer la seconde. Ici le numero est calcule puis reessaye si la base le
 * refuse, ce qui absorbe la concurrence.
 */
const buildOrderNumber = async (attempt) => {
  const year = new Date().getFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));

  const count = await prisma.order.count({ where: { createdAt: { gte: startOfYear } } });

  return `IC-${year}-${String(count + 1 + attempt).padStart(4, '0')}`;
};

/**
 * Calcule le prix d'une commande a partir du produit en base.
 *
 * Rien n'est repris de la requete : ni le prix de base, ni celui des options.
 * L'implementation precedente additionnait les prix d'options envoyes par le
 * client, qui pouvait donc les declarer a zero.
 *
 * Le supplement sur-mesure est desormais facture. Il etait affiche au client
 * sur la page de commande mais jamais ajoute au total enregistre : toutes les
 * commandes sur-mesure etaient sous-facturees.
 */
const computePricing = (product, { size, selectedOptions }) => {
  const basePriceValue = toNumber(product.basePrice);
  const promoValue = toNumber(product.promoPrice);

  const hasPromo = promoValue != null && promoValue > 0 && promoValue < basePriceValue;
  const basePrice = hasPromo ? promoValue : basePriceValue;

  // Les options sont resolues par leur nom contre celles du produit.
  // Une option inconnue est ignoree plutot que facturee au prix annonce.
  const productOptions = Array.isArray(product.options) ? product.options : [];
  const resolvedOptions = (Array.isArray(selectedOptions) ? selectedOptions : [])
    .map((selected) => productOptions.find((option) => option.name === selected?.name))
    .filter(Boolean)
    .map((option) => ({ name: option.name, price: Number(option.price) || 0 }));

  const optionsPrice = resolvedOptions.reduce((sum, option) => sum + option.price, 0);
  const customSurcharge = size === 'sur-mesure' ? toNumber(product.customPriceImpact) || 0 : 0;

  return {
    basePrice,
    optionsPrice,
    customSurcharge,
    totalPrice: basePrice + optionsPrice + customSurcharge,
    resolvedOptions,
  };
};

/**
 * Identifie l'utilisateur connecte si un token valide accompagne la requete.
 * La commande reste possible sans compte : un token absent ou invalide ne doit
 * jamais faire echouer la creation.
 */
const resolveUserId = async (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer')) return null;

  try {
    const decoded = jwt.verify(header.split(' ')[1], config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true } });
    return user ? user.id : null;
  } catch {
    return null;
  }
};

/**
 * @desc    Creer une nouvelle commande
 * @route   POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const { product: productId, selectedOptions = [], size, measurements, customer, notes } = req.body;

    if (!size) {
      return next(new AppError('La taille est requise', 400));
    }
    if (!customer?.fullName || !customer?.phone || !customer?.email) {
      return next(new AppError('Les informations client sont requises', 400));
    }

    const product = productId
      ? await prisma.product.findUnique({ where: { id: productId } })
      : null;

    if (!product) {
      return next(new AppError('Produit non trouvé', 404));
    }
    if (!product.isActive) {
      return next(new AppError("Ce produit n'est plus disponible", 400));
    }

    if (size === 'sur-mesure') {
      const { shoulders, chest, waist, hips } = measurements || {};
      if (!shoulders || !chest || !waist || !hips) {
        return next(
          new AppError('Les mesures sont requises pour une commande sur mesure', 400)
        );
      }
    }

    const pricing = computePricing(product, { size, selectedOptions });
    const userId = await resolveUserId(req);

    const data = {
      productId,
      productSnapshot: {
        name: product.name,
        slug: product.slug,
        category: product.category,
        mainImage: product.mainImage || product.images?.[0] || null,
        basePrice: toNumber(product.basePrice),
      },
      selectedOptions: pricing.resolvedOptions,
      size,
      customer: {
        fullName: customer.fullName,
        phone: customer.phone,
        email: String(customer.email).toLowerCase().trim(),
      },
      measurements:
        size === 'sur-mesure' && measurements
          ? {
              shoulders: Number(measurements.shoulders) || undefined,
              chest: Number(measurements.chest) || undefined,
              waist: Number(measurements.waist) || undefined,
              hips: Number(measurements.hips) || undefined,
              garmentLength: Number(measurements.garmentLength) || undefined,
              notes: measurements.notes || undefined,
            }
          : undefined,
      basePrice: pricing.basePrice,
      optionsPrice: pricing.optionsPrice,
      customSurcharge: pricing.customSurcharge,
      totalPrice: pricing.totalPrice,
      notes: notes || null,
      userId,
    };

    // Jusqu'a 5 tentatives : couvre largement deux commandes simultanees.
    let order = null;
    for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
      try {
        order = await prisma.order.create({
          data: { ...data, orderNumber: await buildOrderNumber(attempt) },
          include: { product: PRODUCT_SUMMARY },
        });
      } catch (error) {
        const isDuplicateNumber =
          error.code === 'P2002' && error.meta?.target?.includes?.('orderNumber');
        if (!isDuplicateNumber) throw error;
      }
    }

    if (!order) {
      return next(new AppError('Impossible de générer un numéro de commande', 500));
    }

    // L'echec d'envoi du mail ne doit jamais annuler une commande enregistree.
    try {
      await sendOrderConfirmationEmail({
        to: order.customer.email,
        customerName: order.customer.fullName || 'Client',
        orderNumber: order.orderNumber,
        productName: product.name,
        totalPrice: pricing.totalPrice,
        size,
      });
    } catch (err) {
      console.error(`[EMAIL] Erreur envoi confirmation pour commande ${order.id}: ${err.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: serializeOrder(order),
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return next(new AppError('Produit non trouvé', 404));
    }
    next(error);
  }
};

/**
 * Remplace le produit par son snapshot lorsqu'il a ete supprime, pour que
 * l'affichage d'une commande ancienne reste lisible.
 */
const withProductFallback = (order) => {
  const productDeleted = !order.product;
  return {
    ...order,
    product:
      order.product ||
      order.productSnapshot || {
        name: '[Produit supprimé]',
        slug: null,
        category: null,
        mainImage: null,
      },
    productDeleted,
  };
};

/**
 * @desc    Recuperer les commandes de l'utilisateur connecte
 * @route   GET /api/orders/my-orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { customer: { path: ['email'], equals: req.user.email } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { product: PRODUCT_SUMMARY },
    });

    const data = serializeMany(serializeOrder, orders).map(withProductFallback);

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recuperer toutes les commandes
 * @route   GET /api/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, email, sort = '-createdAt' } = req.query;
    const { pageNum, limitNum, skip } = parsePagination({ ...req.query, limit: req.query.limit || 10 });

    const where = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (email) where.customer = { path: ['email'], equals: String(email).toLowerCase() };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: parseSort(sort, SORTABLE_FIELDS),
        skip,
        take: limitNum,
        include: { product: PRODUCT_SUMMARY },
      }),
      prisma.order.count({ where }),
    ]);

    paginated(res, {
      message: 'Commandes récupérées avec succès',
      data: serializeMany(serializeOrder, orders).map(withProductFallback),
      total,
      pageNum,
      limitNum,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recuperer une commande par ID
 * @route   GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { product: PRODUCT_SUMMARY },
    });

    if (!order) {
      return next(new AppError('Commande non trouvée', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Commande récupérée avec succès',
      data: serializeOrder(order),
    });
  } catch (error) {
    next(error);
  }
};

const STATUS_NOTIFICATIONS = {
  in_production: {
    subject: 'Votre commande est en confection',
    message:
      'Bonne nouvelle ! Votre commande est maintenant en cours de confection par nos artisans.',
  },
  ready: {
    subject: 'Votre commande est prête',
    message: 'Excellente nouvelle ! Votre commande est prête et vous attend.',
  },
  delivered: {
    subject: 'Commande livrée',
    message: 'Votre commande a été livrée. Merci pour votre confiance !',
  },
};

const onStatusChange = async (order, newStatus) => {
  const notification = STATUS_NOTIFICATIONS[newStatus];
  if (!notification || !order.customer?.email) return;

  try {
    await sendOrderStatusEmail({
      to: order.customer.email,
      customerName: order.customer.fullName || 'Client',
      orderNumber: order.orderNumber,
      productName: order.product?.name,
      status: newStatus,
      subject: notification.subject,
      message: notification.message,
    });
  } catch (err) {
    console.error(`[EMAIL] Erreur envoi email pour commande ${order.id}: ${err.message}`);
  }
};

/**
 * @desc    Mettre a jour le statut d'une commande
 * @route   PATCH /api/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;

    if (!status && !paymentStatus) {
      return next(new AppError('Aucun statut à mettre à jour', 400));
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return next(
        new AppError(
          `Statut invalide: ${status}. Valeurs acceptées: ${VALID_STATUSES.join(', ')}`,
          400
        )
      );
    }
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return next(new AppError(`Statut de paiement invalide: ${paymentStatus}`, 400));
    }

    const previous = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!previous) {
      return next(new AppError('Commande non trouvée', 404));
    }

    const data = {};
    if (status) data.status = status;
    if (paymentStatus) data.paymentStatus = paymentStatus;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: { product: PRODUCT_SUMMARY },
    });

    if (status && previous.status !== status) {
      await onStatusChange(order, status);
    }

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: serializeOrder(order),
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Commande non trouvée', 404));
    }
    next(error);
  }
};

/**
 * @desc    Mettre a jour les notes internes (admin)
 * @route   PATCH /api/orders/:id/notes
 */
const updateAdminNotes = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;

    if (adminNotes === undefined) {
      return next(new AppError('Le champ adminNotes est requis', 400));
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { adminNotes },
      include: { product: PRODUCT_SUMMARY },
    });

    res.status(200).json({
      success: true,
      message: 'Notes internes mises à jour',
      data: serializeOrder(order),
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Commande non trouvée', 404));
    }
    next(error);
  }
};

/**
 * @desc    Mettre a jour les informations atelier d'une commande
 * @route   PATCH /api/orders/:id/workshop
 */
const updateWorkshopInfo = async (req, res, next) => {
  try {
    const { assignedTailor, productionStartDate, expectedDeliveryDate, workshopStatus } = req.body;

    if (workshopStatus && !VALID_WORKSHOP_STATUSES.includes(workshopStatus)) {
      return next(new AppError(`Statut atelier invalide: ${workshopStatus}`, 400));
    }

    const data = {};
    if (assignedTailor !== undefined) data.assignedTailor = assignedTailor;
    if (productionStartDate !== undefined) {
      data.productionStartDate = productionStartDate ? new Date(productionStartDate) : null;
    }
    if (expectedDeliveryDate !== undefined) {
      data.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
    }
    if (workshopStatus) data.workshopStatus = workshopStatus;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: { product: PRODUCT_SUMMARY },
    });

    res.status(200).json({
      success: true,
      message: 'Informations atelier mises à jour',
      data: serializeOrder(order),
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Commande non trouvée', 404));
    }
    next(error);
  }
};

/**
 * @desc    Vue atelier — commandes actives
 * @route   GET /api/orders/workshop
 */
const getWorkshopOrders = async (req, res, next) => {
  try {
    const { workshopStatus, assignedTailor, sort = 'expectedDeliveryDate' } = req.query;

    const where = { status: { notIn: ['delivered', 'cancelled'] } };
    if (workshopStatus) where.workshopStatus = workshopStatus;
    if (assignedTailor) {
      where.assignedTailor = { contains: assignedTailor, mode: 'insensitive' };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: parseSort(sort, SORTABLE_FIELDS, { expectedDeliveryDate: 'asc' }),
      include: {
        product: PRODUCT_SUMMARY,
        client: { select: { id: true, fullName: true, phone: true } },
      },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: serializeMany(serializeOrder, orders),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  computePricing,
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateAdminNotes,
  updateWorkshopInfo,
  getWorkshopOrders,
};
