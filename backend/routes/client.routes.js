const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientOrders,
} = require('../controllers/client.controller');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware');

const clientValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Le nom complet est requis')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Le numéro de téléphone est requis'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Email invalide'),
  body('clientType')
    .optional()
    .isIn(['sur_place', 'en_ligne']).withMessage('Type de client invalide'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('L\'adresse ne peut pas dépasser 500 caractères'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
  body('measurements.shoulders')
    .optional()
    .isFloat({ min: 0 }).withMessage('La mesure des épaules doit être positive'),
  body('measurements.chest')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le tour de poitrine doit être positif'),
  body('measurements.waist')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le tour de taille doit être positif'),
  body('measurements.hips')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le tour de hanches doit être positif'),
  body('measurements.boubouLength')
    .optional()
    .isFloat({ min: 0 }).withMessage('La longueur boubou doit être positive'),
  body('measurements.pantsLength')
    .optional()
    .isFloat({ min: 0 }).withMessage('La longueur pantalon doit être positive'),
  body('measurements.sleeveLength')
    .optional()
    .isFloat({ min: 0 }).withMessage('La longueur manche doit être positive'),
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('ID invalide'),
];

// Toutes les routes sont protégées (admin only)
router.use(protect, adminOnly);

router
  .route('/')
  .post(validate(clientValidation), createClient)
  .get(getAllClients);

router
  .route('/:id')
  .get(validate(mongoIdValidation), getClientById)
  .put(validate([...mongoIdValidation, ...clientValidation]), updateClient)
  .delete(validate(mongoIdValidation), deleteClient);

router.get('/:id/orders', validate(mongoIdValidation), getClientOrders);

module.exports = router;
