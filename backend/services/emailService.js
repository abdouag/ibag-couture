const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Get or create the SMTP transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[EMAIL] SMTP non configure — emails desactives');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log(`[EMAIL] Transporter SMTP configure: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  return transporter;
}

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback
 * @returns {Promise<Object>} nodemailer info
 */
async function sendEmail({ to, subject, html, text }) {
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log(`[EMAIL] Desactive — email non envoye a ${to}`);
    return null;
  }

  const t = getTransporter();
  if (!t) return null;

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  const info = await t.sendMail({ from, to, subject, html, text });
  console.log(`[EMAIL] Envoye a ${to} — messageId: ${info.messageId}`);
  return info;
}

/**
 * Send order status update email
 * @param {Object} params
 * @param {string} params.to - Customer email
 * @param {string} params.customerName - Customer name
 * @param {string} params.orderNumber - Order ID or number
 * @param {string} params.productName - Product name
 * @param {string} params.status - New status
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Status message
 */
async function sendOrderStatusEmail({ to, customerName, orderNumber, productName, status, subject, message }) {
  const statusColors = {
    in_production: '#f59e0b',
    ready: '#22c55e',
    delivered: '#3b82f6',
    cancelled: '#ef4444',
  };

  const statusLabels = {
    in_production: 'En confection',
    ready: 'Prete',
    delivered: 'Livree',
    cancelled: 'Annulee',
  };

  const color = statusColors[status] || '#78716c';
  const label = statusLabels[status] || status;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 24px;background:linear-gradient(135deg,#292524,#44403c);text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">IBAG COUTURE</h1>
        <p style="margin:4px 0 0;color:#d6d3d1;font-size:12px;letter-spacing:2px;">MAISON DE COUTURE</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;">
        <p style="margin:0 0 16px;color:#44403c;font-size:16px;">Bonjour <strong>${customerName}</strong>,</p>
        <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">${message}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border-radius:8px;border:1px solid #e7e5e4;">
          <tr>
            <td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#78716c;font-size:13px;">Commande</td>
                  <td style="padding:4px 0;color:#292524;font-size:13px;text-align:right;font-weight:600;">#${orderNumber}</td>
                </tr>
                ${productName ? `<tr>
                  <td style="padding:4px 0;color:#78716c;font-size:13px;">Produit</td>
                  <td style="padding:4px 0;color:#292524;font-size:13px;text-align:right;font-weight:600;">${productName}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:4px 0;color:#78716c;font-size:13px;">Statut</td>
                  <td style="padding:4px 0;text-align:right;">
                    <span style="display:inline-block;padding:4px 12px;background:${color};color:#ffffff;font-size:12px;font-weight:600;border-radius:12px;">${label}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;background:#fafaf9;border-top:1px solid #e7e5e4;text-align:center;">
        <p style="margin:0;color:#a8a29e;font-size:12px;">Ibag Couture — Maison de couture africaine haut de gamme</p>
        <p style="margin:4px 0 0;color:#a8a29e;font-size:11px;">Cet email a ete envoye automatiquement, merci de ne pas y repondre.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Bonjour ${customerName},\n\n${message}\n\nCommande: #${orderNumber}\n${productName ? `Produit: ${productName}\n` : ''}Statut: ${label}\n\n— Ibag Couture`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send order confirmation email when a customer places an order
 */
async function sendOrderConfirmationEmail({ to, customerName, orderNumber, productName, totalPrice, size }) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 24px;background:linear-gradient(135deg,#292524,#44403c);text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">IBAG COUTURE</h1>
        <p style="margin:4px 0 0;color:#d6d3d1;font-size:12px;letter-spacing:2px;">MAISON DE COUTURE</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;">
        <p style="margin:0 0 16px;color:#44403c;font-size:16px;">Bonjour <strong>${customerName}</strong>,</p>
        <p style="margin:0 0 8px;color:#57534e;font-size:15px;line-height:1.6;">Merci pour votre commande ! Nous l'avons bien recue et elle sera traitee dans les plus brefs delais.</p>
        <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">Vous recevrez un email des que votre commande sera prise en charge par nos artisans.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border-radius:8px;border:1px solid #e7e5e4;">
          <tr>
            <td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#78716c;font-size:13px;">Commande</td>
                  <td style="padding:4px 0;color:#292524;font-size:13px;text-align:right;font-weight:600;">#${orderNumber}</td>
                </tr>
                ${productName ? `<tr>
                  <td style="padding:4px 0;color:#78716c;font-size:13px;">Produit</td>
                  <td style="padding:4px 0;color:#292524;font-size:13px;text-align:right;font-weight:600;">${productName}</td>
                </tr>` : ''}
                ${size ? `<tr>
                  <td style="padding:4px 0;color:#78716c;font-size:13px;">Taille</td>
                  <td style="padding:4px 0;color:#292524;font-size:13px;text-align:right;font-weight:600;">${size}</td>
                </tr>` : ''}
                ${totalPrice ? `<tr>
                  <td style="padding:4px 0;color:#78716c;font-size:13px;">Total</td>
                  <td style="padding:4px 0;color:#292524;font-size:15px;text-align:right;font-weight:700;">${totalPrice.toLocaleString('fr-FR')} FCFA</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:4px 0;color:#78716c;font-size:13px;">Statut</td>
                  <td style="padding:4px 0;text-align:right;">
                    <span style="display:inline-block;padding:4px 12px;background:#78716c;color:#ffffff;font-size:12px;font-weight:600;border-radius:12px;">En attente</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;background:#fafaf9;border-top:1px solid #e7e5e4;text-align:center;">
        <p style="margin:0;color:#a8a29e;font-size:12px;">Ibag Couture — Maison de couture africaine haut de gamme</p>
        <p style="margin:4px 0 0;color:#a8a29e;font-size:11px;">Cet email a ete envoye automatiquement, merci de ne pas y repondre.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Bonjour ${customerName},\n\nMerci pour votre commande !\n\nCommande: #${orderNumber}\n${productName ? `Produit: ${productName}\n` : ''}${size ? `Taille: ${size}\n` : ''}${totalPrice ? `Total: ${totalPrice.toLocaleString('fr-FR')} FCFA\n` : ''}Statut: En attente\n\nVous recevrez un email des que votre commande sera prise en charge.\n\n— Ibag Couture`;

  return sendEmail({ to, subject: 'Confirmation de votre commande — Ibag Couture', html, text });
}

module.exports = {
  sendEmail,
  sendOrderStatusEmail,
  sendOrderConfirmationEmail,
};
