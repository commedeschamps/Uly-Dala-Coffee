const sgMail = require('@sendgrid/mail');

const fromEmail = process.env.SENDGRID_FROM_EMAIL;
const apiKey = process.env.SENDGRID_API_KEY;
const isConfigured = Boolean(apiKey && fromEmail);

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const safeSend = async (message) => {
  if (!isConfigured) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[email] SendGrid is not configured');
    }
    return;
  }

  try {
    await sgMail.send(message);
  } catch (error) {
    const details = error?.response?.body || error.message;
    console.error('[email] SendGrid send failed:', details);
  }
};

const sendWelcomeEmail = async ({ to, name }) => {
  if (!to) return;
  const subject = 'Welcome to Uly Dala Coffee';
  const text = `Hi ${name || 'there'}, welcome to Uly Dala Coffee. Your account is ready.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to Uly Dala Coffee</h2>
      <p>Hi ${name || 'there'}, your account is ready.</p>
      <p>Start exploring the menu and place your first order anytime.</p>
    </div>
  `;

  await safeSend({
    to,
    from: fromEmail,
    subject,
    text,
    html,
  });
};

const sendOrderStatusEmail = async ({ to, name, order }) => {
  if (!to || !order) return;
  const subject = `Order ${order.status} · Uly Dala Coffee`;
  const items = (order.items || [])
    .map((item) => `${item.quantity}x ${item.name} (${item.size})`)
    .join(', ');
  const text = `Hi ${name || 'there'}, your order is now ${order.status}. Items: ${items}. Total: ${order.total} ₸.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Order update</h2>
      <p>Hi ${name || 'there'}, your order is now <strong>${order.status}</strong>.</p>
      <p><strong>Items:</strong> ${items || '—'}</p>
      <p><strong>Total:</strong> ${order.total} ₸</p>
    </div>
  `;

  await safeSend({
    to,
    from: fromEmail,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendOrderStatusEmail,
};
