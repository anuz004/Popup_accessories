import express from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { notificationFor } from './orderEmail.mjs';
import { GridFSBucket, ObjectId } from 'mongodb';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

class MongoSessionStore extends session.Store {
  constructor(db) { super(); this.collection = db.collection('sessions'); }
  get(sid, callback) {
    this.collection.findOne({ _id: sid, expires: { $gt: new Date() } })
      .then(row => callback(null, row?.session ?? null)).catch(callback);
  }
  set(sid, value, callback = () => {}) {
    const expires = value.cookie.expires ? new Date(value.cookie.expires) : new Date(Date.now() + 8 * 3600000);
    this.collection.updateOne({ _id: sid }, { $set: { session: value, expires } }, { upsert: true })
      .then(() => callback()).catch(callback);
  }
  destroy(sid, callback = () => {}) {
    this.collection.deleteOne({ _id: sid }).then(() => callback()).catch(callback);
  }
}
const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function text(value, label, max = 120, optional = false) {
  if (optional && (value == null || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`Invalid ${label}`);
  return value.trim();
}
function number(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(`Invalid ${label}`);
  return value;
}
function bool(value, fallback = true) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') fail('Invalid active status');
  return value;
}
function product(input) {
  const photos = input.image_urls ?? (input.image_url ? [input.image_url] : []);
  if (!Array.isArray(photos) || photos.length > 5) fail('A product can have up to five photos');
  for (const url of photos) if (typeof url !== 'string' || url.length > 2048 || !(/^(https?:\/\/)/i.test(url) || /^\/api\/product-images\/[a-f0-9]{24}$/.test(url))) fail('Invalid photo URL');
  const result = {
    name: text(input.name, 'product name'), line: text(input.line, 'collection', 80),
    category: text(input.category, 'category'), gender: text(input.gender, 'gender'),
    price: number(input.price, 'price', 1), original_price: input.original_price == null ? null : number(input.original_price, 'original price', 1),
    badge: input.badge ? text(input.badge, 'badge', 20) : null,
    style: input.style ?? 'classic', case_color: input.case_color ?? '#C9A961',
    dial_color: input.dial_color ?? '#0F0F10', accent: input.accent ?? '#D4AF37',
    movement: text(input.movement, 'movement'), active: bool(input.active),
    image_url: photos[0] || null, image_urls: photos,
  };
  if (!Number.isSafeInteger(result.price) || (result.original_price != null && !Number.isSafeInteger(result.original_price))) fail('Prices must be whole rupees');
  if (!['Classic','Sport','Luxury','Smart','Limited Edition'].includes(result.category)
    || !['Men','Women','Unisex'].includes(result.gender)
    || !['classic','sport','smart','diamond','minimal'].includes(result.style)
    || !['Automatic','Quartz','Smart OS'].includes(result.movement)) fail('Invalid product options');
  for (const key of ['case_color','dial_color','accent']) if (!/^#[a-f0-9]{6}$/i.test(result[key])) fail('Invalid watch color');
  for (const key of ['water_resistance','dial','case_material','strap_material','case_size','description','short'])
    result[key] = text(input[key], key, key === 'description' ? 5000 : 500, true);
  return result;
}
function offer(input) {
  const result = {
    title: text(input.title, 'offer title'), code: input.code ? text(input.code, 'coupon code', 50).toUpperCase() : null,
    discount_type: input.discount_type, discount_value: number(input.discount_value, 'discount', 0.01),
    scope: input.scope, target: input.target ? text(input.target, 'offer target') : null,
    active: bool(input.active), starts_at: input.starts_at ?? null, ends_at: input.ends_at ?? null,
  };
  if (!['percent','flat'].includes(result.discount_type) || !['all','category','product'].includes(result.scope)
    || (result.discount_type === 'percent' && result.discount_value > 100)
    || (result.scope !== 'all' && !result.target)) fail('Invalid discount options');
  if (result.discount_type === 'flat' && !Number.isSafeInteger(result.discount_value)) fail('Flat discounts must be whole rupees');
  for (const key of ['starts_at','ends_at']) if (result[key] && !Number.isFinite(Date.parse(result[key]))) fail('Invalid offer date');
  if (result.starts_at && result.ends_at && Date.parse(result.ends_at) <= Date.parse(result.starts_at)) fail('Offer end must follow start');
  return result;
}
const publicRow = ({ _id, password_hash: _passwordHash, email_notifications: _notifications, ...row }) => row;
const liveOffer = (o, now) => o.active && (!o.starts_at || Date.parse(o.starts_at) <= now) && (!o.ends_at || Date.parse(o.ends_at) >= now);
const applies = (o, p) => o.scope === 'all' || (o.scope === 'category' && o.target === p.category) || (o.scope === 'product' && o.target === p.id);

export function createApp(db, options) {
  const app = express();
  app.disable('x-powered-by');
  if (options.production) app.set('trust proxy', 1);
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      const sameOrigin = `${req.protocol}://${req.get('host')}`;
      const allowed = options.production ? [options.origin, sameOrigin] : [options.origin, sameOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (origin && !allowed.includes(origin)) return res.status(403).json({ error: 'Request origin is not allowed' });
      if (req.method !== 'DELETE' && req.method !== 'GET' && !req.is('application/json')) return res.status(415).json({ error: 'Use JSON requests' });
    }
    next();
  });
  app.get('/api/health', async (_req, res) => {
    if (!db) return res.status(503).json({ error: 'MongoDB Atlas connection is not configured yet.' });
    await db.command({ ping: 1 }); res.json({ data: { connected: true, database: db.databaseName } });
  });
  app.use('/api', (_req, res, next) => db ? next() : res.status(503).json({ error: 'MongoDB Atlas connection is not configured yet.' }));
  app.use(session({
    name: 'grand_hour_session', secret: options.secret, store: db ? new MongoSessionStore(db) : undefined,
    resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: Boolean(options.production), maxAge: 8 * 3600000 },
  }));
  const admin = async (req, res, next) => {
    if (!req.session.adminId) return res.status(401).json({ error: 'Administrator sign-in required' });
    const user = await db.collection('admin_users').findOne({ id: req.session.adminId });
    if (!user) return res.status(401).json({ error: 'Administrator access is unavailable' });
    req.admin = user; next();
  };
  app.post('/api/product-images', admin, async (req, res) => {
    const data = req.body.dataUrl;
    if (typeof data !== 'string' || data.length > 1400000) fail('Photo must be under 1 MB');
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(data);
    if (!match) fail('Use a JPG, PNG, or WebP photo');
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > 1024 * 1024 || bytes.length < 12) fail('Invalid photo size');
    const valid = match[1] === 'jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!valid) fail('The file does not match its photo type');
    const bucket = new GridFSBucket(db, { bucketName: 'product_photos' });
    const stream = bucket.openUploadStream(`${randomUUID()}.${match[1]}`, { metadata: { contentType: `image/${match[1]}`, uploadedBy: req.admin.id } });
    await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); stream.end(bytes); });
    res.status(201).json({ data: { url: `/api/product-images/${stream.id}` } });
  });
  app.get('/api/product-images/:id', async (req, res) => {
    if (!/^[a-f0-9]{24}$/.test(req.params.id)) fail('Photo not found', 404);
    const id = new ObjectId(req.params.id);
    const file = await db.collection('product_photos.files').findOne({ _id: id });
    if (!file) fail('Photo not found', 404);
    res.setHeader('Content-Type', file.metadata.contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    new GridFSBucket(db, { bucketName: 'product_photos' }).openDownloadStream(id)
      .on('error', () => res.destroy()).pipe(res);
  });
  const authLimiter = rateLimit({ windowMs: 15 * 60000, limit: 15, standardHeaders: true, legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: 'Too many sign-in attempts. Try again later.' }) });
  const submissionLimiter = rateLimit({ windowMs: 60000, limit: 20, standardHeaders: true, legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: 'Too many requests. Try again shortly.' }) });
  app.get('/api/auth/config', (_req, res) => res.json({ data: { googleEnabled: Boolean(options.googleAuth), emailEnabled: Boolean(options.emailEnabled) } }));
  app.get('/api/auth/google', authLimiter, async (req, res) => {
    if (!options.googleAuth) return res.status(503).json({ error: 'Google sign-in is not configured yet.' });
    const state = randomBytes(32).toString('hex'); const nonce = randomBytes(32).toString('hex');
    const returnTo = req.query.returnTo === 'checkout' ? 'checkout' : 'account';
    const { url, verifier } = await options.googleAuth.start(state, nonce);
    req.session.googleFlow = { state, nonce, verifier, returnTo, expires: Date.now() + 10 * 60000 };
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    res.redirect(url);
  });
  app.get('/api/auth/google/callback', async (req, res) => {
    const flow = req.session.googleFlow; delete req.session.googleFlow;
    const origin = options.origin || 'http://127.0.0.1:5173';
    const redirectError = () => res.redirect(`${origin}/#/account?error=google`);
    const received = typeof req.query.state === 'string' ? req.query.state : '';
    if (!options.googleAuth || !flow || flow.expires < Date.now() || ! /^[a-f0-9]{64}$/.test(received) || received.length !== flow.state.length || !timingSafeEqual(Buffer.from(received), Buffer.from(flow.state)) || typeof req.query.code !== 'string' || req.query.error) return redirectError();
    try {
      const identity = await options.googleAuth.finish(req.query.code, flow.verifier, flow.nonce);
      if (!identity.sub || !emailPattern.test(identity.email)) return redirectError();
      const customer = await db.collection('customers').findOneAndUpdate({ google_sub: identity.sub }, {
        $set: { email: identity.email.toLowerCase(), name: String(identity.name).slice(0,120), updated_at: new Date().toISOString() },
        $setOnInsert: { id: randomUUID(), google_sub: identity.sub, created_at: new Date().toISOString() },
      }, { upsert: true, returnDocument: 'after' });
      await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
      req.session.customerId = customer.id;
      await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
      res.redirect(`${origin}/#/${flow.returnTo}`);
    } catch { redirectError(); }
  });
  app.get('/api/auth/session', async (req, res) => {
    const adminUser = req.session.adminId ? await db.collection('admin_users').findOne({ id: req.session.adminId }) : null;
    const customer = req.session.customerId ? await db.collection('customers').findOne({ id: req.session.customerId }) : null;
    const user = adminUser ? { email: adminUser.email, role: 'admin' } : customer ? { id: customer.id, email: customer.email, name: customer.name, role: 'customer' } : null;
    res.json({ data: { user } });
  });
  app.get('/api/customer/orders', async (req, res) => {
    const customer = req.session.customerId ? await db.collection('customers').findOne({ id: req.session.customerId }) : null;
    if (!customer) return res.status(401).json({ error: 'Customer sign-in required' });
    const orders = await db.collection('orders').find({ customer_id: customer.id }).sort({ created_at: -1 }).toArray();
    res.json({ data: orders.map(publicRow) });
  });
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const email = text(req.body.email, 'email', 254).toLowerCase();
    const password = req.body.password;
    if (typeof password !== 'string' || password.length === 0 || password.length > 128) fail('Invalid password');
    const user = await db.collection('admin_users').findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Incorrect email or password' });
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.adminId = user.id;
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    res.json({ data: { user: { email: user.email, role: 'admin' } } });
  });
  app.post('/api/auth/logout', (req, res, next) => {
    req.session.destroy(error => { if (error) return next(error); res.clearCookie('grand_hour_session'); res.json({ data: null }); });
  });
  for (const table of ['products','offers']) {
    app.get(`/api/${table}`, async (req, res) => {
      const isAdmin = req.session.adminId && await db.collection('admin_users').findOne({ id: req.session.adminId });
      const filter = isAdmin ? {} : { active: true };
      if (req.query.active === 'true') filter.active = true;
      const rows = await db.collection(table).find(filter).sort({ created_at: req.query.ascending === 'true' ? 1 : -1 }).toArray();
      res.json({ data: rows.map(publicRow) });
    });
    app.post(`/api/${table}`, admin, async (req, res) => {
      const payload = table === 'products' ? product(req.body) : offer(req.body);
      const row = { ...payload, id: randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        ...(table === 'products' ? { rating: 0, reviews: 0 } : {}) };
      await db.collection(table).insertOne(row); res.status(201).json({ data: [publicRow(row)] });
    });
    app.patch(`/api/${table}/:id`, admin, async (req, res) => {
      let payload;
      if (Object.keys(req.body).length === 1 && 'active' in req.body) payload = { active: bool(req.body.active) };
      else payload = table === 'products' ? product(req.body) : offer(req.body);
      const row = await db.collection(table).findOneAndUpdate({ id: req.params.id }, { $set: { ...payload, updated_at: new Date().toISOString() } }, { returnDocument: 'after' });
      if (!row) fail('Record not found', 404); res.json({ data: [publicRow(row)] });
    });
    app.delete(`/api/${table}/:id`, admin, async (req, res) => {
      const result = await db.collection(table).deleteOne({ id: req.params.id });
      if (!result.deletedCount) fail('Record not found', 404); res.json({ data: [] });
    });
  }
  for (const table of ['orders','contact_messages','newsletter_subscribers']) {
    app.get(`/api/${table}`, admin, async (_req, res) => {
      res.json({ data: (await db.collection(table).find({}).sort({ created_at: -1 }).toArray()).map(publicRow) });
    });
  }
  app.patch('/api/orders/:id', admin, async (req, res) => {
    if (!statuses.includes(req.body.status)) fail('Invalid order status');
    const changed = await db.collection('orders').findOneAndUpdate({ id: req.params.id, status: { $ne: req.body.status } }, { $set: { status: req.body.status, updated_at: new Date().toISOString() }, $push: { email_notifications: notificationFor(req.body.status) } }, { returnDocument: 'after' });
    const row = changed || await db.collection('orders').findOne({ id: req.params.id });
    if (!row) fail('Order not found', 404); res.json({ data: [publicRow(row)] });
  });
  app.post('/api/contact_messages', submissionLimiter, async (req, res) => {
    const email = text(req.body.email, 'email', 254).toLowerCase(); if (!emailPattern.test(email)) fail('Invalid email');
    const row = { id: randomUUID(), name: text(req.body.name, 'name'), email,
      phone: text(req.body.phone, 'phone', 30, true) || null, message: text(req.body.message, 'message', 4000), status: 'new', created_at: new Date().toISOString() };
    await db.collection('contact_messages').insertOne(row); res.status(201).json({ data: [publicRow(row)] });
  });
  app.patch('/api/contact_messages/:id', admin, async (req, res) => {
    if (req.body.status !== 'resolved') fail('Invalid message status');
    const row = await db.collection('contact_messages').findOneAndUpdate({ id: req.params.id }, { $set: { status: 'resolved' } }, { returnDocument: 'after' });
    if (!row) fail('Message not found', 404); res.json({ data: [publicRow(row)] });
  });
  app.post('/api/newsletter_subscribers', submissionLimiter, async (req, res) => {
    const email = text(req.body.email, 'email', 254).toLowerCase(); if (!emailPattern.test(email)) fail('Invalid email');
    await db.collection('newsletter_subscribers').updateOne({ email }, { $setOnInsert: { id: randomUUID(), email, active: true, created_at: new Date().toISOString() } }, { upsert: true });
    res.status(201).json({ data: [] });
  });
  app.post('/api/orders', submissionLimiter, async (req, res) => {
    const customer = req.body.customer ?? {}; const cart = req.body.cart_items;
    if (!Array.isArray(cart) || cart.length === 0 || cart.length > 50) fail('Your bag must contain between 1 and 50 items');
    const address = {};
    for (const key of ['first_name','last_name','phone','email','address','state','city','pincode']) address[key] = text(customer[key], key, key === 'address' ? 1000 : 254);
    if (!/^\d{10}$/.test(address.phone) || !/^\d{6}$/.test(address.pincode) || !emailPattern.test(address.email)) fail('Invalid delivery details');
    const signedCustomer = req.session.customerId ? await db.collection('customers').findOne({ id: req.session.customerId }) : null;
    address.email = signedCustomer ? signedCustomer.email : address.email.toLowerCase();
    const now = Date.now(); const offers = (await db.collection('offers').find({ active: true }).toArray()).filter(o => liveOffer(o, now));
    const code = req.body.coupon ? text(req.body.coupon, 'coupon', 50).toUpperCase() : null;
    const coupon = code ? offers.find(o => o.code === code) : null;
    if (code && !coupon) fail('Invalid or expired coupon code');
    let subtotal = 0; let eligibleSubtotal = 0; const items = []; const quantities = new Map();
    for (const item of cart) {
      const id = text(item.product_id, 'product ID');
      const qty = number(item.qty, 'quantity', 1, 9); if (!Number.isInteger(qty)) fail('Invalid quantity');
      quantities.set(id, (quantities.get(id) ?? 0) + qty); if (quantities.get(id) > 9) fail('Maximum quantity is 9 per product');
      const p = await db.collection('products').findOne({ id, active: true }); if (!p) fail('A product is unavailable');
      let price = p.price;
      for (const o of offers.filter(o => !o.code && applies(o, p))) price = Math.min(price, o.discount_type === 'percent' ? Math.round(p.price * (1 - o.discount_value / 100)) : Math.max(0, p.price - Math.round(o.discount_value)));
      subtotal += price * qty; if (coupon && applies(coupon, p)) eligibleSubtotal += price * qty;
      items.push({ product_id: id, name: p.name, price, qty });
    }
    if (coupon && !eligibleSubtotal) fail('This coupon does not apply to your bag');
    const discount = coupon ? Math.min(eligibleSubtotal, coupon.discount_type === 'percent' ? Math.round(eligibleSubtotal * coupon.discount_value / 100) : Math.round(coupon.discount_value)) : 0;
    const shipping = subtotal - discount < 5000 ? 99 : 0;
    const row = { id: randomUUID(), order_number: `GH-${randomUUID().replaceAll('-', '').slice(0,8).toUpperCase()}`, ...address, items,
      customer_id: signedCustomer?.id ?? null, email_notifications: [notificationFor('Pending')],
      subtotal, discount, shipping, total: subtotal - discount + shipping, status: 'Pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await db.collection('orders').insertOne(row); res.status(201).json({ data: publicRow(row) });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  app.use((error, _req, res, _next) => {
    if (error.code === 11000) return res.status(409).json({ error: 'This record already exists', code: '23505' });
    const status = error.status ?? 500;
    res.status(status).json({ error: status < 500 ? error.message : 'The database request failed. Please try again.' });
  });
  return app;
}
