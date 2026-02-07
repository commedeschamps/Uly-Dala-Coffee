const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || 'smtp.zoho.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || (smtpUser ? `Uly Dala Coffee <${smtpUser}>` : undefined);
const normalizeAppUrl = (value) => String(value || '').trim().replace(/\/+$/, '');
const defaultAppUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://coffee-shop.commedeschamps.dev'
    : 'http://localhost:4000';
const appUrl = normalizeAppUrl(process.env.APP_URL) || defaultAppUrl;
const brandName = 'Uly Dala Coffee';

const isConfigured = Boolean(smtpHost && smtpUser && smtpPass && smtpFrom);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

const safeSend = async (message) => {
  if (!isConfigured || !transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[email] SMTP is not configured');
    }
    return;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      ...message,
    });
  } catch (error) {
    console.error('[email] SMTP send failed:', error.message);
  }
};

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const capitalize = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return 'Unknown';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatAmount = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `${numeric.toFixed(2)} KZT`;
  }
  return `${value || '-'} KZT`;
};

const buildEmailHtml = ({ preheader, title, intro, bodyHtml, ctaText, ctaUrl, footerText }) => {
  const safePreheader = escapeHtml(preheader || '');
  const safeTitle = escapeHtml(title || '');
  const safeIntro = escapeHtml(intro || '');
  const safeCtaText = escapeHtml(ctaText || 'Open');
  const safeCtaUrl = escapeHtml(ctaUrl || appUrl);
  const safeFooterText = escapeHtml(footerText || `This message was sent by ${brandName}.`);

  return `
    <div style="background:#f5f1ea;padding:24px 12px;font-family:Arial,sans-serif;color:#2f2a25;">
      <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
        ${safePreheader}
      </span>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
        <tr>
          <td style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #eadfce;">
            <p style="margin:0 0 14px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#9b7b53;">
              ${brandName}
            </p>
            <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#2f2a25;">${safeTitle}</h1>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#4f463d;">${safeIntro}</p>
            <div style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3f372f;">
              ${bodyHtml}
            </div>
            <a href="${safeCtaUrl}"
              style="display:inline-block;padding:12px 18px;background:#6f4e37;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px;">
              ${safeCtaText}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 6px 0;text-align:center;font-size:12px;line-height:1.6;color:#7a6f62;">
            ${safeFooterText}
          </td>
        </tr>
      </table>
    </div>
  `;
};

const sendWelcomeEmail = async ({ to, name }) => {
  if (!to) return;
  const safeName = name || 'there';
  const subject = `Welcome to ${brandName}`;
  const text = [
    `Hi ${name || 'there'},`,
    '',
    `Welcome to ${brandName}. Your account is ready.`,
    'You can now explore the menu and place your first order.',
    '',
    `Open app: ${appUrl}`,
  ].join('\n');
  const html = buildEmailHtml({
    preheader: `Welcome to ${brandName}. Your account is ready.`,
    title: `Welcome, ${safeName}`,
    intro: 'Your account is ready and you can start ordering now.',
    bodyHtml: `
      <p style="margin:0 0 12px;">Thanks for joining us. We are excited to prepare your next cup.</p>
      <p style="margin:0;">Check out the menu, customize your drinks, and track your order status in real time.</p>
    `,
    ctaText: 'Browse Menu',
    ctaUrl: `${appUrl}/products.html`,
    footerText: `Need help? Reply to this email and our team will assist you.`,
  });

  await safeSend({
    to,
    subject,
    text,
    html,
  });
};

const sendOrderStatusEmail = async ({ to, name, order }) => {
  if (!to || !order) return;
  const customerName = name || 'there';
  const status = capitalize(order.status);
  const statusColor =
    status.toLowerCase() === 'cancelled'
      ? '#b43232'
      : status.toLowerCase() === 'completed'
        ? '#2a7b47'
        : '#7d5a35';

  const itemLines = (order.items || []).map((item) => {
    const quantity = Number(item.quantity) || 0;
    const itemName = item.name || 'Item';
    const itemSize = item.size || 'regular';
    return `${quantity}x ${itemName} (${itemSize})`;
  });

  const itemRowsHtml = (order.items || [])
    .map((item) => {
      const quantity = escapeHtml(Number(item.quantity) || 0);
      const itemName = escapeHtml(item.name || 'Item');
      const itemSize = escapeHtml(item.size || 'regular');
      const unitPrice = formatAmount(item.unitPrice);
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #efe4d4;">${quantity}x ${itemName}</td>
          <td style="padding:8px 0;border-bottom:1px solid #efe4d4;color:#7a6f62;text-align:right;">${itemSize} - ${escapeHtml(unitPrice)}</td>
        </tr>
      `;
    })
    .join('');

  const subject = `Order ${status} | ${brandName}`;
  const text = [
    `Hi ${customerName},`,
    '',
    `Your order status is now: ${status}.`,
    `Items: ${itemLines.length ? itemLines.join(', ') : '-'}.`,
    `Total: ${formatAmount(order.total)}.`,
    '',
    `Track your orders: ${appUrl}/account.html`,
  ].join('\n');
  const html = buildEmailHtml({
    preheader: `Your order status is now ${status}.`,
    title: 'Order Update',
    intro: `Hi ${customerName}, your order is now ${status}.`,
    bodyHtml: `
      <p style="margin:0 0 12px;">
        <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#f5ebe0;color:${statusColor};font-weight:700;">
          ${escapeHtml(status)}
        </span>
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.5;color:#3f372f;">
        ${itemRowsHtml || '<tr><td style="padding:8px 0;">No items found.</td></tr>'}
      </table>
      <p style="margin:14px 0 0;font-weight:700;">Total: ${escapeHtml(formatAmount(order.total))}</p>
    `,
    ctaText: 'View Orders',
    ctaUrl: `${appUrl}/account.html`,
    footerText: `If this update looks incorrect, reply to this email and include your order details.`,
  });

  await safeSend({
    to,
    subject,
    text,
    html,
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl, expiresMinutes = 15 }) => {
  if (!to || !resetUrl) return;

  const customerName = name || 'there';
  const subject = `Reset your password | ${brandName}`;
  const text = [
    `Hi ${customerName},`,
    '',
    'We received a request to reset your password.',
    `Open this link to set a new password (expires in ${expiresMinutes} minutes):`,
    resetUrl,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');
  const html = buildEmailHtml({
    preheader: 'Password reset request',
    title: 'Reset your password',
    intro: `Hi ${customerName}, use the secure link below to set a new password.`,
    bodyHtml: `
      <p style="margin:0 0 12px;">
        This reset link is valid for <strong>${escapeHtml(expiresMinutes)}</strong> minutes.
      </p>
      <p style="margin:0;">
        If you did not request a password reset, ignore this message and your password will remain unchanged.
      </p>
    `,
    ctaText: 'Set New Password',
    ctaUrl: resetUrl,
    footerText: 'For security, never share this link with anyone.',
  });

  await safeSend({
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendOrderStatusEmail,
  sendPasswordResetEmail,
};
