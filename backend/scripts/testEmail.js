/**
 * Script de test email — usage: node scripts/testEmail.js
 */
require('dotenv').config();

const { sendOrderStatusEmail } = require('../services/emailService');

async function main() {
  console.log('=== Test envoi email Ibag Couture ===\n');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`EMAIL_ENABLED: ${process.env.EMAIL_ENABLED}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM}\n`);

  try {
    const result = await sendOrderStatusEmail({
      to: 'abdouazizg58@gmail.com',
      customerName: 'Abdou (Test)',
      orderNumber: 'TEST-001',
      productName: 'Boubou Prestige Bazin',
      status: 'in_production',
      subject: '[TEST] Votre commande est en confection - Ibag Couture',
      message: 'Ceci est un email de test. Votre commande est maintenant en cours de confection par nos artisans.',
    });

    if (result) {
      console.log('Email envoye avec succes !');
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.log('Email non envoye — verifiez EMAIL_ENABLED et la config SMTP');
    }
  } catch (err) {
    console.error('Erreur:', err.message);
    if (err.code) console.error('Code:', err.code);
  }
}

main();
