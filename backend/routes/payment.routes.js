const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  createPayment,
  getAllPayments,
  getPaymentById,
  deletePayment,
} = require('../controllers/payment.controller');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware');

const paymentValidation = [
  body('order')
    .notEmpty().withMessage('La commande est requise')
    .isMongoId().withMessage('ID de commande invalide'),
  body('client')
    .optional()
    .isMongoId().withMessage('ID de client invalide'),
  body('amount')
    .notEmpty().withMessage('Le montant est requis')
    .isFloat({ min: 1 }).withMessage('Le montant doit être supérieur à 0'),
  body('paymentMethod')
    .notEmpty().withMessage('La méthode de paiement est requise')
    .isIn(['especes', 'wave', 'orange_money', 'autre']).withMessage('Méthode de paiement invalide'),
  body('paymentDate')
    .optional()
    .isISO8601().withMessage('Date de paiement invalide'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Les notes ne peuvent pas dépasser 500 caractères'),
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('ID invalide'),
];

// Toutes les routes sont protégées (admin only)
router.use(protect, adminOnly);

router
  .route('/')
  .post(validate(paymentValidation), createPayment)
  .get(getAllPayments);

router
  .route('/:id')
  .get(validate(mongoIdValidation), getPaymentById)
  .delete(validate(mongoIdValidation), deletePayment);

module.exports = router;
