const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'La commande est requise'],
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [1, 'Le montant doit être supérieur à 0'],
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['especes', 'wave', 'orange_money', 'autre'],
      message: 'Méthode de paiement invalide: {VALUE}',
    },
    required: [true, 'La méthode de paiement est requise'],
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères'],
  },
}, {
  timestamps: true,
});

paymentSchema.index({ order: 1, createdAt: -1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
