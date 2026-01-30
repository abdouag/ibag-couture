const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { generateProduct } = require('../controllers/ai.controller');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware');

const generateValidation = [
  body('category')
    .notEmpty().withMessage('La categorie est requise')
    .isIn(['homme', 'femme', 'traditionnel', 'moderne']).withMessage('Categorie invalide'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Le nom ne peut pas depasser 200 caracteres'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit etre positif'),
  body('isCustomAvailable')
    .optional()
    .isBoolean().withMessage('isCustomAvailable doit etre un booleen'),
  body('generateImages')
    .optional()
    .isBoolean().withMessage('generateImages doit etre un booleen'),
  body('referenceImageUrl')
    .optional()
    .isURL().withMessage('referenceImageUrl doit etre une URL valide'),
];

// Toutes les routes sont protegees (admin only)
router.use(protect, adminOnly);

router.post('/generate-product', validate(generateValidation), generateProduct);

module.exports = router;
