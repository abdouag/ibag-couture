const express = require('express');
const router = express.Router();

const {
  exportClients,
  exportMeasurements,
  exportOrders,
  exportPayments,
  exportFinances,
} = require('../controllers/export.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/clients', exportClients);
router.get('/measurements', exportMeasurements);
router.get('/orders', exportOrders);
router.get('/payments', exportPayments);
router.get('/finances', exportFinances);

module.exports = router;
