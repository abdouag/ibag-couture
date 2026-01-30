/**
 * Migration one-shot : paymentStatus enum
 * unpaid → non_paye, paid → paye, refunded → rembourse
 *
 * Usage: node scripts/migratePaymentStatus.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

const migrate = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connecté à MongoDB');

    const db = mongoose.connection.db;
    const orders = db.collection('orders');

    const migrations = [
      { from: 'unpaid', to: 'non_paye' },
      { from: 'paid', to: 'paye' },
      { from: 'refunded', to: 'rembourse' },
    ];

    for (const { from, to } of migrations) {
      const result = await orders.updateMany(
        { paymentStatus: from },
        { $set: { paymentStatus: to } }
      );
      console.log(`${from} → ${to}: ${result.modifiedCount} commande(s) migrée(s)`);
    }

    // Ajouter workshopStatus par défaut aux commandes existantes qui n'en ont pas
    const wsResult = await orders.updateMany(
      { workshopStatus: { $exists: false } },
      { $set: { workshopStatus: 'en_attente' } }
    );
    console.log(`workshopStatus ajouté à ${wsResult.modifiedCount} commande(s)`);

    console.log('Migration terminée avec succès');
  } catch (error) {
    console.error('Erreur de migration:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

migrate();
