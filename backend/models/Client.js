const mongoose = require('mongoose');

const customMeasurementSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Le libellé de la mesure est requis'],
    trim: true,
  },
  value: {
    type: Number,
    required: [true, 'La valeur de la mesure est requise'],
    min: [0, 'La mesure doit être positive'],
  },
}, { _id: false });

const clientMeasurementsSchema = new mongoose.Schema({
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
  boubouLength: {
    type: Number,
    min: [0, 'La mesure doit être positive'],
  },
  pantsLength: {
    type: Number,
    min: [0, 'La mesure doit être positive'],
  },
  sleeveLength: {
    type: Number,
    min: [0, 'La mesure doit être positive'],
  },
  customMeasurements: [customMeasurementSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères'],
  },
}, { _id: false });

const clientSchema = new mongoose.Schema({
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
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
  },
  clientType: {
    type: String,
    enum: {
      values: ['sur_place', 'en_ligne'],
      message: 'Type de client invalide: {VALUE}',
    },
    default: 'sur_place',
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'L\'adresse ne peut pas dépasser 500 caractères'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères'],
  },
  measurements: {
    type: clientMeasurementsSchema,
    default: null,
  },
}, {
  timestamps: true,
});

// Index pour recherche texte
clientSchema.index({ fullName: 'text', phone: 'text' });
clientSchema.index({ phone: 1 });
clientSchema.index({ clientType: 1 });
clientSchema.index({ createdAt: -1 });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
