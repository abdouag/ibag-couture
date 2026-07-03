const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { validate } = require('../middleware');

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ max: 200 }).withMessage('Le nom ne peut pas dépasser 200 caractères'),
  body('category')
    .notEmpty().withMessage('La catégorie est requise')
    .isIn(['homme', 'femme', 'traditionnel', 'moderne'])
    .withMessage('Catégorie invalide'),
  body('basePrice')
    .notEmpty().withMessage('Le prix de base est requis')
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('mainImage')
    .optional()
    .isString().withMessage('L\'image principale doit être une chaîne'),
  body('images')
    .optional()
    .isArray().withMessage('Les images doivent être un tableau'),
  body('images.*')
    .optional()
    .isString().withMessage('Chaque image doit être une chaîne de caractères'),
  body('availableSizes')
    .optional()
    .isArray().withMessage('Les tailles doivent être un tableau'),
  body('availableSizes.*')
    .optional()
    .isIn(['S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Taille invalide'),
  body('isCustomAvailable')
    .optional()
    .isBoolean().withMessage('isCustomAvailable doit être un booléen'),
  body('customPriceImpact')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le supplément sur-mesure doit être positif'),
  body('options')
    .optional()
    .isArray().withMessage('Les options doivent être un tableau'),
  body('options.*.name')
    .optional()
    .notEmpty().withMessage('Le nom de l\'option est requis'),
  body('options.*.price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix de l\'option doit être positif'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('productionTime')
    .optional()
    .isInt({ min: 1 }).withMessage('Le temps de production doit être d\'au moins 1 jour'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('hasStock')
    .optional()
    .isBoolean().withMessage('hasStock doit être un booléen'),
  body('stockQuantity')
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage('La quantité en stock doit être un entier positif ou nul'),
  body('promoPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Le prix promotionnel doit être un nombre positif'),
];

const updateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Le nom ne peut pas être vide')
    .isLength({ max: 200 }).withMessage('Le nom ne peut pas dépasser 200 caractères'),
  body('category')
    .optional()
    .isIn(['homme', 'femme', 'traditionnel', 'moderne'])
    .withMessage('Catégorie invalide'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('mainImage')
    .optional()
    .isString().withMessage('L\'image principale doit être une chaîne'),
  body('images')
    .optional()
    .isArray().withMessage('Les images doivent être un tableau'),
  body('availableSizes')
    .optional()
    .isArray().withMessage('Les tailles doivent être un tableau'),
  body('availableSizes.*')
    .optional()
    .isIn(['S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Taille invalide'),
  body('isCustomAvailable')
    .optional()
    .isBoolean().withMessage('isCustomAvailable doit être un booléen'),
  body('customPriceImpact')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le supplément sur-mesure doit être positif'),
  body('options')
    .optional()
    .isArray().withMessage('Les options doivent être un tableau'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('productionTime')
    .optional()
    .isInt({ min: 1 }).withMessage('Le temps de production doit être d\'au moins 1 jour'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('hasStock')
    .optional()
    .isBoolean().withMessage('hasStock doit être un booléen'),
  body('stockQuantity')
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage('La quantité en stock doit être un entier positif ou nul'),
  body('promoPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Le prix promotionnel doit être un nombre positif'),
];

const mongoIdValidation = [
  param('id')
    .isMongoId().withMessage('ID invalide'),
];

const slugValidation = [
  param('slug')
    .trim()
    .notEmpty().withMessage('Le slug est requis'),
];

// Routes
router
  .route('/')
  .post(validate(productValidation), createProduct)
  .get(getAllProducts);

router
  .route('/:slug')
  .get(validate(slugValidation), getProductBySlug);

router
  .route('/:id')
  .put(validate([...mongoIdValidation, ...updateValidation]), updateProduct)
  .delete(validate(mongoIdValidation), deleteProduct);

module.exports = router;
