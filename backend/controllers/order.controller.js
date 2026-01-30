const Order = require('../models/Order');
const Product = require('../models/Product');
const { AppError } = require('../middleware');

/**
 * @desc    Créer une nouvelle commande
 * @route   POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const {
      product: productId,
      selectedOptions = [],
      size,
      measurements,
      customer,
      notes,
    } = req.body;

    // Vérifier que la taille est fournie
    if (!size) {
      return next(new AppError('La taille est requise', 400));
    }

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Produit non trouvé', 404));
    }

    if (!product.isActive) {
      return next(new AppError('Ce produit n\'est plus disponible', 400));
    }

    // Calculer les prix
    const basePrice = product.basePrice;
    const optionsPrice = selectedOptions.reduce((sum, opt) => sum + (opt.price || 0), 0);
    const totalPrice = basePrice + optionsPrice;

    // Préparer les données de commande
    const orderData = {
      product: productId,
      selectedOptions,
      size,
      customer,
      basePrice,
      optionsPrice,
      totalPrice,
      notes: notes || undefined,
    };

    // Ajouter les mesures uniquement si sur-mesure
    if (size === 'sur-mesure' && measurements) {
      orderData.measurements = {
        shoulders: parseFloat(measurements.shoulders) || undefined,
        chest: parseFloat(measurements.chest) || undefined,
        waist: parseFloat(measurements.waist) || undefined,
        hips: parseFloat(measurements.hips) || undefined,
        garmentLength: parseFloat(measurements.garmentLength) || undefined,
        notes: measurements.notes || undefined,
      };
    }

    // Créer la commande
    const order = await Order.create(orderData);

    // Populer le produit pour la réponse
    await order.populate('product', 'name slug category productionTime');

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order,
    });
  } catch (error) {
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
 * @desc    Récupérer toutes les commandes
 * @route   GET /api/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      email,
      sort = '-createdAt',
      page = 1,
      limit = 10,
    } = req.query;

    // Construction du filtre
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (email) {
      filter['customer.email'] = email.toLowerCase();
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Exécution des requêtes en parallèle
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('product', 'name slug category productionTime')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Commandes récupérées avec succès',
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer une commande par ID
 * @route   GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('product', 'name slug category images productionTime')
      .lean();

    if (!order) {
      return next(new AppError('Commande non trouvée', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Commande récupérée avec succès',
      data: order,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de commande invalide', 400));
    }
    next(error);
  }
};

// Statuts valides pour les commandes
const VALID_STATUSES = ['pending', 'in_production', 'ready', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['non_paye', 'acompte', 'paye', 'rembourse', 'unpaid', 'paid', 'refunded'];
const VALID_WORKSHOP_STATUSES = ['en_attente', 'en_cours', 'retouche', 'pret', 'livre'];

// Messages de notification par statut (pour implementation future)
const STATUS_NOTIFICATIONS = {
  in_production: {
    subject: 'Votre commande est en confection',
    message: 'Bonne nouvelle ! Votre commande est maintenant en cours de confection par nos artisans.',
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

/**
 * Hook pour envoyer une notification au client lors d'un changement de statut
 * TODO: Implémenter l'envoi d'email réel
 * @param {Object} order - La commande mise à jour
 * @param {string} newStatus - Le nouveau statut
 */
const onStatusChange = async (order, newStatus) => {
  const notification = STATUS_NOTIFICATIONS[newStatus];
  if (!notification || !order.customer?.email) return;

  // TODO: Implémenter l'envoi d'email ici
  // Exemple avec un service d'email:
  // await emailService.send({
  //   to: order.customer.email,
  //   subject: notification.subject,
  //   template: 'order-status-update',
  //   data: {
  //     customerName: order.customer.fullName,
  //     orderNumber: order.orderNumber || order._id,
  //     productName: order.product?.name,
  //     message: notification.message,
  //   },
  // });

  console.log(`[Email Hook] Notification "${newStatus}" préparée pour ${order.customer.email}`);
};

/**
 * @desc    Mettre à jour le statut d'une commande
 * @route   PATCH /api/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    // Vérifier qu'au moins un statut est fourni
    if (!status && !paymentStatus) {
      return next(new AppError('Aucun statut à mettre à jour', 400));
    }

    // Valider les valeurs de statut
    if (status && !VALID_STATUSES.includes(status)) {
      return next(new AppError(`Statut invalide: ${status}. Valeurs acceptées: ${VALID_STATUSES.join(', ')}`, 400));
    }

    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return next(new AppError(`Statut de paiement invalide: ${paymentStatus}`, 400));
    }

    // Récupérer l'ancien statut pour le hook
    const oldOrder = await Order.findById(id).lean();
    if (!oldOrder) {
      return next(new AppError('Commande non trouvée', 404));
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('product', 'name slug category');

    // Appeler le hook si le statut a changé
    if (status && oldOrder.status !== status) {
      await onStatusChange(order, status);
    }

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: order,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    if (error.name === 'CastError') {
      return next(new AppError('ID de commande invalide', 400));
    }
    next(error);
  }
};

/**
 * @desc    Mettre à jour les notes internes (admin)
 * @route   PATCH /api/orders/:id/notes
 */
const updateAdminNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    if (adminNotes === undefined) {
      return next(new AppError('Le champ adminNotes est requis', 400));
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { adminNotes },
      { new: true, runValidators: true }
    ).populate('product', 'name slug category');

    if (!order) {
      return next(new AppError('Commande non trouvée', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Notes internes mises à jour',
      data: order,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de commande invalide', 400));
    }
    next(error);
  }
};

/**
 * @desc    Mettre à jour les informations atelier d'une commande
 * @route   PATCH /api/orders/:id/workshop
 */
const updateWorkshopInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTailor, productionStartDate, expectedDeliveryDate, workshopStatus } = req.body;

    if (workshopStatus && !VALID_WORKSHOP_STATUSES.includes(workshopStatus)) {
      return next(new AppError(`Statut atelier invalide: ${workshopStatus}`, 400));
    }

    const updateData = {};
    if (assignedTailor !== undefined) updateData.assignedTailor = assignedTailor;
    if (productionStartDate !== undefined) updateData.productionStartDate = productionStartDate;
    if (expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = expectedDeliveryDate;
    if (workshopStatus) updateData.workshopStatus = workshopStatus;

    const order = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('product', 'name slug category productionTime');

    if (!order) {
      return next(new AppError('Commande non trouvée', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Informations atelier mises à jour',
      data: order,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('ID de commande invalide', 400));
    }
    next(error);
  }
};

/**
 * @desc    Vue atelier — commandes actives avec infos atelier
 * @route   GET /api/orders/workshop
 */
const getWorkshopOrders = async (req, res, next) => {
  try {
    const {
      workshopStatus,
      assignedTailor,
      sort = 'expectedDeliveryDate',
    } = req.query;

    const filter = {
      status: { $nin: ['delivered', 'cancelled'] },
    };

    if (workshopStatus) filter.workshopStatus = workshopStatus;
    if (assignedTailor) filter.assignedTailor = { $regex: assignedTailor, $options: 'i' };

    const orders = await Order.find(filter)
      .populate('product', 'name slug category productionTime')
      .populate('client', 'fullName phone')
      .sort(sort)
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateAdminNotes,
  updateWorkshopInfo,
  getWorkshopOrders,
};
