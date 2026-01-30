const express = require('express');
const router = express.Router();

const {
  getSummary,
  getRevenue,
  getByMethod,
  getOutstanding,
} = require('../controllers/finance.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/summary', getSummary);
router.get('/revenue', getRevenue);
router.get('/by-method', getByMethod);
router.get('/outstanding', getOutstanding);

module.exports = router;
