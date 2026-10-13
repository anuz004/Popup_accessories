import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';

export function notificationFor(status) {
  return { id: randomUUID(), status, state: 'pending', attempts: 0, created_at: new Date().toISOString(), next_attempt: new Date(0).toISOString() };
}
const descriptions = {
  Pending: 'We have received your order. We will email you when it is confirmed.',
  Confirmed: 'Your order is confirmed and is being prepared.',
  Shipped: 'Your order has been shipped and is on its way.',
  Delivered: 'Your order has been delivered. Thank you for shopping with Grand Hour.',
  Cancelled: 'Your order has been cancelled. Contact us if you need help.',
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function orderMessage(order, event, from) {
  const label = event.status === 'Pending' ? 'Order placed' : event.status;
  const amount = value => `₹${Number(value).toLocaleString('en-IN')}`;
  const lines = order.items.map(item => `${item.name} × ${item.qty}: ${amount(item.price * item.qty)}`);
  const message = descriptions[event.status];
  return {
    from, to: order.email,
    subject: `Grand Hour · ${order.order_number} · ${label}`,
    messageId: `<${event.id}@grandhour.local>`,
    text: [`Hello ${order.first_name},`, message, `Order: ${order.order_number}`, `Status: ${label}`,
      ...lines, `Subtotal: ${amount(order.subtotal)}`, `Discount: ${amount(order.discount)}`, `Shipping: ${amount(order.shipping)}`, `Total (Cash on Delivery): ${amount(order.total)}`,
      'For help, reply to this email.', 'Grand Hour'].join('\n'),
    html: `<h1>${escape(label)}</h1><p>Hello ${escape(order.first_name)},</p><p>${escape(message)}</p><p>Order: <strong>${escape(order.order_number)}</strong></p><ul>${lines.map(line => `<li>${escape(line)}</li>`).join('')}</ul><p>Subtotal: ${escape(amount(order.subtotal))}<br>Discount: ${escape(amount(order.discount))}<br>Shipping: ${escape(amount(order.shipping))}<br><strong>Total (Cash on Delivery): ${escape(amount(order.total))}</strong></p><p>For help, reply to this email.<br>Grand Hour</p>`,
  };
}
export function gmailSender(env) {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  const transport = nodemailer.createTransport({ host: env.SMTP_HOST || 'smtp.gmail.com', port: Number(env.SMTP_PORT || 465),
    secure: Number(env.SMTP_PORT || 465) === 465, requireTLS: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS.replace(/\s/g, '') },
    connectionTimeout: 10000, socketTimeout: 20000 });
  return { from: env.EMAIL_FROM || `Grand Hour <${env.SMTP_USER}>`, send: message => transport.sendMail(message) };
}
/** Notifications live in the order document so status changes and queued emails are atomic. */
export async function deliverOrderEmails(db, sender) {
  if (!sender) return;
  const now = new Date().toISOString();
  const orders = await db.collection('orders').find({ email_notifications: { $elemMatch: {
    $or: [{ state: 'pending', next_attempt: { $lte: now } }, { state: 'sending', locked_until: { $lte: now } }],
  } } }).limit(20).toArray();
  for (const order of orders) {
    const event = order.email_notifications.find(e => e.state === 'pending' && e.next_attempt <= now || e.state === 'sending' && e.locked_until <= now);
    if (!event) continue;
    // Keep status messages in order. An earlier unsent event must be delivered first.
    if (order.email_notifications.slice(0, order.email_notifications.indexOf(event)).some(e => e.state !== 'sent')) continue;
    const claimed = await db.collection('orders').updateOne({ id: order.id, email_notifications: { $elemMatch: {
      id: event.id, $or: [{ state: 'pending', next_attempt: { $lte: now } }, { state: 'sending', locked_until: { $lte: now } }],
    } } }, { $set: { 'email_notifications.$.state': 'sending', 'email_notifications.$.locked_until': new Date(Date.now() + 120000).toISOString() }, $inc: { 'email_notifications.$.attempts': 1 } });
    if (!claimed.modifiedCount) continue;
    try {
      await sender.send(orderMessage(order, event, sender.from));
      await db.collection('orders').updateOne({ id: order.id, 'email_notifications.id': event.id }, { $set: { 'email_notifications.$.state': 'sent', 'email_notifications.$.sent_at': new Date().toISOString() }, $unset: { 'email_notifications.$.locked_until': '' } });
    } catch {
      const delay = Math.min(3600000, 30000 * 2 ** Math.min(event.attempts, 7));
      await db.collection('orders').updateOne({ id: order.id, 'email_notifications.id': event.id }, { $set: {
        'email_notifications.$.state': 'pending', 'email_notifications.$.next_attempt': new Date(Date.now() + delay).toISOString(),
      }, $unset: { 'email_notifications.$.locked_until': '' } });
    }
  }
}
export function startEmailWorker(db, sender) {
  let running = false;
  const tick = async () => { if (running) return; running = true; try { await deliverOrderEmails(db, sender); } catch { console.error('Order email processing failed; it will retry.'); } finally { running = false; } };
  const timer = setInterval(tick, 10000); timer.unref(); void tick();
  return () => clearInterval(timer);
}
