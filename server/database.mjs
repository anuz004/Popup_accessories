import { randomUUID } from 'node:crypto';

/** Creates the project collections, indexes, and initial admin without replacing existing data. */
export async function initializeDatabase(db, { adminEmail, passwordHash } = {}) {
  await db.command({ ping: 1 });
  for (const table of ['products','offers','orders','contact_messages','newsletter_subscribers','admin_users','customers'])
    await db.collection(table).createIndex({ id: 1 }, { unique: true });
  await db.collection('customers').createIndex({ google_sub: 1 }, { unique: true });
  await db.collection('orders').createIndex({ customer_id: 1, created_at: -1 });
  await db.collection('admin_users').createIndex({ email: 1 }, { unique: true });
  await db.collection('newsletter_subscribers').createIndex({ email: 1 }, { unique: true });
  await db.collection('orders').createIndex({ order_number: 1 }, { unique: true });
  await db.collection('offers').createIndex({ code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
  await db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  if (adminEmail && passwordHash) {
    if (!/^\$2[aby]\$\d{2}\$/.test(passwordHash)) throw new Error('ADMIN_PASSWORD_HASH must be a bcrypt hash');
    const email = adminEmail.trim().toLowerCase();
    await db.collection('admin_users').updateOne({ email },
      { $setOnInsert: { id: randomUUID(), email, password_hash: passwordHash, created_at: new Date().toISOString() } }, { upsert: true });
  }
}
