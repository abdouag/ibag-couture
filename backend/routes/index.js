const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const uploadRoutes = require('./upload.routes');
const clientRoutes = require('./client.routes');
const paymentRoutes = require('./payment.routes');
const financeRoutes = require('./finance.routes');
const exportRoutes = require('./export.routes');
const aiRoutes = require('./ai.routes');

// API Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API Ibag Couture',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      api: 'GET /api',
      auth: 'POST /api/auth/login, POST /api/auth/register',
      products: 'GET /api/products',
      orders: 'GET /api/orders',
      uploads: 'POST /api/uploads/product (admin)',
    },
  });
});

// Use route modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/uploads', uploadRoutes);
router.use('/clients', clientRoutes);
router.use('/payments', paymentRoutes);
router.use('/finances', financeRoutes);
router.use('/exports', exportRoutes);
router.use('/admin/ai', aiRoutes);

module.exports = router;
