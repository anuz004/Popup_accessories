import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { createApp } from './app.mjs';
import { initializeDatabase } from './database.mjs';
let mongo, client, server, db, base;
const adminEmail = 'admin@example.test';
const adminPassword = 'TestOnlyPassword!';
const sample = { name: 'Test watch', line: 'Test', category: 'Classic', gender: 'Unisex', price: 1000, movement: 'Quartz' };
before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: 'work/mongodb-test-runtime' } });
  client = await new MongoClient(mongo.getUri()).connect(); db = client.db('grand_hour_test');
  await initializeDatabase(db, { adminEmail, passwordHash: await bcrypt.hash(adminPassword, 4) });
  const app = createApp(db, { secret: 'test-session-secret-for-testing-only-1234567890', production: false });
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  await new Promise(resolve => server ? server.close(resolve) : resolve());
  await client?.close(); await mongo?.stop();
});
async function call(path, method = 'GET', payload, cookie) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: payload === undefined ? undefined : JSON.stringify(payload) });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function login() { return (await call('/auth/login', 'POST', { email: adminEmail, password: adminPassword })).cookie; }
test('private collections and mutations require server-side admin authentication', async () => {
  for (const table of ['orders','contact_messages','newsletter_subscribers']) assert.equal((await call('/' + table)).status, 401);
  assert.equal((await call('/products', 'POST', sample)).status, 401);
  assert.equal((await call('/auth/login', 'POST', { email: adminEmail, password: 'wrong' })).status, 401);
  assert.equal((await call('/auth/session')).body.data.user, null);
});
test('admin session persists, CRUD works, hidden products stay private, and logout revokes access', async () => {
  const cookie = await login(); assert.ok(cookie);
  assert.equal((await call('/auth/session', 'GET', undefined, cookie)).body.data.user.email, adminEmail);
  const added = await call('/products', 'POST', sample, cookie); assert.equal(added.status, 201);
  const id = added.body.data[0].id;
  assert.equal((await call(`/products/${id}`, 'PATCH', { active: false }, cookie)).status, 200);
  assert.equal((await call('/products')).body.data.some(p => p.id === id), false);
  assert.equal((await call('/products', 'GET', undefined, cookie)).body.data.some(p => p.id === id), true);
  assert.equal((await call(`/products/${id}`, 'DELETE', undefined, cookie)).status, 200);
  assert.equal((await call('/auth/logout', 'POST', {}, cookie)).status, 200);
  assert.equal((await call('/orders', 'GET', undefined, cookie)).status, 401);
});
test('order totals come from database prices and validated offers, not customer payloads', async () => {
  const cookie = await login();
  const p = (await call('/products', 'POST', sample, cookie)).body.data[0];
  await call('/offers', 'POST', { title: 'Ten percent', code: 'TEN', discount_type: 'percent', discount_value: 10, scope: 'all', active: true }, cookie);
  const customer = { first_name: 'Test', last_name: 'Customer', phone: '9999999999', email: 'buyer@example.test', address: 'Test address', city: 'Test city', state: 'Tamil Nadu', pincode: '641001' };
  const input = { customer, cart_items: [{ product_id: p.id, qty: 2, price: 1 }], coupon: 'TEN', total: 1 };
  const response = await call('/orders', 'POST', input); assert.equal(response.status, 201);
  assert.equal(response.body.data.subtotal, 2000); assert.equal(response.body.data.discount, 200); assert.equal(response.body.data.total, 1899);
  assert.equal((await call('/orders', 'POST', { ...input, cart_items: [{ product_id: p.id, qty: -1 }] })).status, 400);
  const orders = await call('/orders', 'GET', undefined, cookie); assert.equal(orders.body.data.length, 1);
  const orderId = response.body.data.id;
  assert.equal((await call(`/orders/${orderId}`, 'PATCH', { status: 'Shipped' }, cookie)).body.data[0].status, 'Shipped');
});
test('contact and newsletter data are stored, subscribers are unique, cross-origin writes are rejected', async () => {
  const cookie = await login();
  assert.equal((await call('/contact_messages', 'POST', { name: 'Test customer', email: 'contact@example.test', message: 'Test message' })).status, 201);
  const inbox = (await call('/contact_messages', 'GET', undefined, cookie)).body.data;
  assert.equal(inbox.length, 1);
  assert.equal((await call(`/contact_messages/${inbox[0].id}`, 'PATCH', { status: 'resolved' }, cookie)).body.data[0].status, 'resolved');
  await call('/newsletter_subscribers', 'POST', { email: 'subscriber@example.test' });
  await call('/newsletter_subscribers', 'POST', { email: 'subscriber@example.test' });
  assert.equal((await call('/newsletter_subscribers', 'GET', undefined, cookie)).body.data.length, 1);
  const response = await fetch(base + '/products', { method: 'POST', headers: { Origin: 'https://untrusted.example', Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(sample) });
  assert.equal(response.status, 403);
});

test('database initialization creates all project collections and preserves existing admin accounts', async () => {
  const names = (await db.listCollections().toArray()).map(c => c.name);
  for (const name of ['products','offers','orders','contact_messages','newsletter_subscribers','admin_users','sessions']) assert.ok(names.includes(name));
  const before = await db.collection('admin_users').findOne({email:adminEmail});
  await initializeDatabase(db, {adminEmail, passwordHash:await bcrypt.hash('ReplacementShouldNotApply',4)});
  const after = await db.collection('admin_users').findOne({email:adminEmail});
  assert.equal(before.password_hash, after.password_hash);
  const indexes = await db.collection('sessions').indexes();
  assert.ok(indexes.some(i => i.expireAfterSeconds === 0));
});
test('invalid products, invalid discounts, and duplicate coupon codes are rejected', async () => {
  const cookie = await login();
  assert.equal((await call('/products','POST',{...sample,price:1.5},cookie)).status,400);
  assert.equal((await call('/offers','POST',{title:'Too much',discount_type:'percent',discount_value:101,scope:'all'},cookie)).status,400);
  const offer={title:'Unique coupon',code:'UNIQUE',discount_type:'flat',discount_value:100,scope:'all'};
  assert.equal((await call('/offers','POST',offer,cookie)).status,201);
  assert.equal((await call('/offers','POST',offer,cookie)).status,409);
});
test('automatic offers and category coupons combine correctly with free shipping', async () => {
  const cookie=await login();
  const p=(await call('/products','POST',{...sample,category:'Sport',price:6000},cookie)).body.data[0];
  await call('/offers','POST',{title:'Automatic sport sale',discount_type:'percent',discount_value:10,scope:'category',target:'Sport'},cookie);
  await call('/offers','POST',{title:'Sport coupon',code:'SPORT100',discount_type:'flat',discount_value:100,scope:'category',target:'Sport'},cookie);
  const customer={first_name:'Test',last_name:'Buyer',phone:'9999999999',email:'buyer@example.test',address:'Test address',city:'Test city',state:'Tamil Nadu',pincode:'641001'};
  const input={customer,cart_items:[{product_id:p.id,qty:1}],coupon:'SPORT100'};
  const order=await call('/orders','POST',input);
  assert.equal(order.status,201); assert.equal(order.body.data.subtotal,5400); assert.equal(order.body.data.discount,100);
  assert.equal(order.body.data.shipping,0); assert.equal(order.body.data.total,5300);
  assert.equal((await call('/orders','POST',{...input,cart_items:[{product_id:p.id,qty:5},{product_id:p.id,qty:5}]})).status,400);
  await call(`/products/${p.id}`,'PATCH',{active:false},cookie);
  assert.equal((await call('/orders','POST',input)).status,400);
});
test('expired and inapplicable coupons cannot create orders', async () => {
  const cookie=await login();
  const p=(await call('/products','POST',sample,cookie)).body.data[0];
  const customer={first_name:'Test',last_name:'Buyer',phone:'9999999999',email:'buyer@example.test',address:'Test address',city:'Test city',state:'Tamil Nadu',pincode:'641001'};
  const payload={customer,cart_items:[{product_id:p.id,qty:1}]};
  await call('/offers','POST',{title:'Expired',code:'OLD',discount_type:'percent',discount_value:10,scope:'all',ends_at:'2000-01-01T00:00:00Z'},cookie);
  await call('/offers','POST',{title:'Other category',code:'LUXURY',discount_type:'percent',discount_value:10,scope:'category',target:'Luxury'},cookie);
  assert.equal((await call('/orders','POST',{...payload,coupon:'OLD'})).status,400);
  assert.equal((await call('/orders','POST',{...payload,coupon:'LUXURY'})).status,400);
});
test('product photos require admin access, persist in MongoDB, and enforce the five-photo limit', async () => {
  const cookie=await login();
  const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jx1sAAAAASUVORK5CYII=';
  assert.equal((await call('/product-images','POST',{dataUrl:png})).status,401);
  assert.equal((await call('/product-images','POST',{dataUrl:'data:image/jpeg;base64,SGVsbG9Xb3JsZDEyMw=='},cookie)).status,400);
  const urls=[];
  for(let i=0;i<5;i++) {const r=await call('/product-images','POST',{dataUrl:png},cookie);assert.equal(r.status,201);urls.push(r.body.data.url);}
  const added=await call('/products','POST',{...sample,image_urls:urls},cookie);assert.equal(added.status,201);
  assert.deepEqual(added.body.data[0].image_urls,urls);assert.equal(added.body.data[0].image_url,urls[0]);
  const image=await fetch(base+urls[0].slice(4));assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');
  assert.ok((await image.arrayBuffer()).byteLength>12);
  assert.equal((await call('/products','POST',{...sample,image_urls:[...urls,urls[0]]},cookie)).status,400);
  const id=added.body.data[0].id;
  const updated=await call(`/products/${id}`,'PATCH',{...sample,image_urls:[urls[4],urls[0]]},cookie);
  assert.deepEqual(updated.body.data[0].image_urls,[urls[4],urls[0]]);assert.equal(updated.body.data[0].image_url,urls[4]);
  const read=await call('/products');assert.deepEqual(read.body.data.find(p=>p.id===id).image_urls,[urls[4],urls[0]]);
  assert.equal((await call('/product-images/not-an-id')).status,404);
});
