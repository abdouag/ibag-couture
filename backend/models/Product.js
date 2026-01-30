const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'option est requis'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Le prix de l\'option est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
  },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: ['homme', 'femme', 'traditionnel', 'moderne'],
      message: 'Catégorie invalide: {VALUE}',
    },
  },
  basePrice: {
    type: Number,
    required: [true, 'Le prix de base est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
  },
  mainImage: {
    type: String,
    trim: true,
  },
  images: [{
    type: String,
    trim: true,
  }],
  availableSizes: [{
    type: String,
    enum: {
      values: ['S', 'M', 'L', 'XL', 'XXL'],
      message: 'Taille invalide: {VALUE}',
    },
  }],
  isCustomAvailable: {
    type: Boolean,
    default: false,
  },
  customPriceImpact: {
    type: Number,
    default: 0,
    min: [0, 'Le supplement sur-mesure ne peut pas être négatif'],
  },
  options: [optionSchema],
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
  },
  productionTime: {
    type: Number,
    default: 7,
    min: [1, 'Le temps de production doit être d\'au moins 1 jour'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Génération automatique du slug avant sauvegarde
productSchema.pre('save', function() {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// Index pour les recherches
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
