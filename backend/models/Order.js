const mongoose = require('mongoose');

const selectedOptionSchema = new mongoose.Schema({
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

const measurementsSchema = new mongoose.Schema({
  shoulders: {
    type: Number,
    min: [0, 'La mesure doit être positive'],
  },
  chest: {
    type: Number,
    min: [0, 'La mesure doit être positive'],
  },
  waist: {
    type: Number,
    min: [0, 'La mesure doit être positive'],
  },
  hips: {
    type: Number,
    min: [0, 'La mesure doit être positive'],
  },
  garmentLength: {
    type: Number,
    min: [0, 'La mesure doit être positive'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères'],
  },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Le nom complet est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
  },
  phone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Le produit est requis'],
  },
  selectedOptions: [selectedOptionSchema],
  size: {
    type: String,
    enum: {
      values: ['S', 'M', 'L', 'XL', 'XXL', 'sur-mesure'],
      message: 'Taille invalide: {VALUE}',
    },
    required: [true, 'La taille est requise'],
  },
  measurements: {
    type: measurementsSchema,
    default: null,
  },
  customer: {
    type: customerSchema,
    required: [true, 'Les informations client sont requises'],
  },
  basePrice: {
    type: Number,
    required: [true, 'Le prix de base est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
  },
  optionsPrice: {
    type: Number,
    default: 0,
    min: [0, 'Le prix ne peut pas être négatif'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Le prix total est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'in_production', 'ready', 'delivered', 'cancelled'],
      message: 'Statut invalide: {VALUE}',
    },
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['unpaid', 'paid', 'refunded'],
      message: 'Statut de paiement invalide: {VALUE}',
    },
    default: 'unpaid',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères'],
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Les notes internes ne peuvent pas dépasser 2000 caractères'],
  },
}, {
  timestamps: true,
});

// Génération automatique du numéro de commande
orderSchema.pre('save', async function() {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Order').countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.orderNumber = `IC-${year}-${seq}`;
  }
});

// Validation conditionnelle : mesures requises uniquement si sur-mesure
orderSchema.pre('validate', function() {
  if (this.size === 'sur-mesure') {
    if (!this.measurements) {
      this.invalidate('measurements', 'Les mesures sont requises pour une commande sur mesure');
      return;
    }

    const { shoulders, chest, waist, hips } = this.measurements;

    if (!shoulders || shoulders <= 0) {
      this.invalidate('measurements.shoulders', 'La mesure des épaules est requise pour une commande sur mesure');
    }
    if (!chest || chest <= 0) {
      this.invalidate('measurements.chest', 'Le tour de poitrine est requis pour une commande sur mesure');
    }
    if (!waist || waist <= 0) {
      this.invalidate('measurements.waist', 'Le tour de taille est requis pour une commande sur mesure');
    }
    if (!hips || hips <= 0) {
      this.invalidate('measurements.hips', 'Le tour de hanches est requis pour une commande sur mesure');
    }
  }
});

// Index pour les recherches fréquentes
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ size: 1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
