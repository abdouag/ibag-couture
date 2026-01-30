const express = require('express');
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateAdminNotes,
  updateWorkshopInfo,
  getWorkshopOrders,
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/orders - Créer une commande (public)
router.post('/', createOrder);

// GET /api/orders/workshop - Vue atelier (admin) — AVANT /:id pour éviter conflit
router.get('/workshop', protect, adminOnly, getWorkshopOrders);

// GET /api/orders - Liste des commandes (admin)
router.get('/', protect, adminOnly, getAllOrders);

// GET /api/orders/:id - Détail d'une commande (admin)
router.get('/:id', protect, adminOnly, getOrderById);

// PATCH /api/orders/:id/status - Mettre à jour le statut (admin uniquement)
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

// PATCH /api/orders/:id/notes - Mettre à jour les notes internes (admin)
router.patch('/:id/notes', protect, adminOnly, updateAdminNotes);

// PATCH /api/orders/:id/workshop - Mettre à jour les infos atelier (admin)
router.patch('/:id/workshop', protect, adminOnly, updateWorkshopInfo);

module.exports = router;
