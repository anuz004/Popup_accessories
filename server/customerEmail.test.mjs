import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { createApp } from './app.mjs';
import { initializeDatabase } from './database.mjs';
import { deliverOrderEmails, orderMessage } from './orderEmail.mjs';
let mongo, client, db, server, base;
const googleAuth={
  start: async(state,nonce)=>({verifier:'test-verifier',url:`https://accounts.google.com/test?state=${state}&nonce=${nonce}`}),
  finish: async code=>{if(code==='invalid')throw new Error('Invalid identity');return {sub:code,email:code==='buyer'?'buyer@example.test':'other@example.test',name:'Test Customer'};},
};
before(async()=>{
  mongo=await MongoMemoryServer.create({binary:{downloadDir:'work/mongodb-test-runtime'}});client=await new MongoClient(mongo.getUri()).connect();db=client.db('grand_hour_customer_email_test');
  await initializeDatabase(db,{adminEmail:'admin@example.test',passwordHash:await bcrypt.hash('TestAdminPassword!',4)});
  await db.collection('products').insertOne({id:'watch',name:'Test Watch',price:1500,active:true});
  const app=createApp(db,{secret:'customer-email-test-secret-12345678901234567890',production:false,origin:'http://127.0.0.1:5174',googleAuth,emailEnabled:true});
  server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});base=`http://127.0.0.1:${server.address().port}/api`;
});
after(async()=>{await new Promise(r=>server?server.close(r):r());await client?.close();await mongo?.stop();});
async function call(path,method='GET',body,cookie){const r=await fetch(base+path,{method,redirect:'manual',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:r.headers.get('content-type')?.includes('json')?await r.json():null,location:r.headers.get('location'),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function customer(code){const start=await call('/auth/google');assert.equal(start.status,302);const state=new URL(start.location).searchParams.get('state');const done=await call(`/auth/google/callback?state=${state}&code=${code}`,'GET',undefined,start.cookie);assert.equal(done.status,302);assert.ok(done.cookie);return done.cookie;}
async function admin(){return (await call('/auth/login','POST',{email:'admin@example.test',password:'TestAdminPassword!'})).cookie;}
const input={customer:{first_name:'Test',last_name:'Buyer',phone:'9999999999',email:'wrong@example.test',address:'Test address',state:'Tamil Nadu',city:'Coimbatore',pincode:'641001'},cart_items:[{product_id:'watch',qty:1}]};
test('Google state is checked and replayed callbacks cannot sign in',async()=>{
  const start=await call('/auth/google');const state=new URL(start.location).searchParams.get('state');
  const wrong=await call('/auth/google/callback?state=bad&code=buyer','GET',undefined,start.cookie);assert.match(wrong.location,/error=google/);
  const replay=await call(`/auth/google/callback?state=${state}&code=buyer`,'GET',undefined,start.cookie);assert.match(replay.location,/error=google/);
  assert.equal((await call('/auth/session','GET',undefined,start.cookie)).body.data.user,null);
});
test('Google customers can shop but cannot access admin data or another customer order',async()=>{
  const buyer=await customer('buyer');assert.equal((await call('/auth/session','GET',undefined,buyer)).body.data.user.role,'customer');
  for(const path of ['/orders','/contact_messages','/newsletter_subscribers'])assert.equal((await call(path,'GET',undefined,buyer)).status,401);
  assert.equal((await call('/products','POST',{name:'Injection'},buyer)).status,401);
  const order=await call('/orders','POST',input,buyer);assert.equal(order.status,201);assert.equal(order.body.data.email,'buyer@example.test');assert.equal(order.body.data.email_notifications,undefined);
  const mine=await call('/customer/orders','GET',undefined,buyer);assert.equal(mine.body.data.length,1);
  const other=await customer('other');assert.equal((await call('/customer/orders','GET',undefined,other)).body.data.length,0);
  assert.equal((await call('/customer/orders')).status,401);
});
test('placement and every status change send queued emails without duplicating repeated status updates',async()=>{
  const adminCookie=await admin();const created=await call('/orders','POST',input);const id=created.body.data.id;
  for(const status of ['Confirmed','Shipped','Delivered','Cancelled']){
    assert.equal((await call(`/orders/${id}`,'PATCH',{status},adminCookie)).status,200);
    assert.equal((await call(`/orders/${id}`,'PATCH',{status},adminCookie)).status,200);
  }
  const order=await db.collection('orders').findOne({id});assert.equal(order.email_notifications.length,5);
  const messages=[];const sender={from:'Grand Hour <sender@example.test>',send:async m=>messages.push(m)};
  for(let i=0;i<5;i++)await deliverOrderEmails(db,sender);
  const forOrder=messages.filter(m=>m.subject.includes(order.order_number));assert.equal(forOrder.length,5);
  assert.match(forOrder[0].subject,/Order placed/);assert.match(forOrder[3].subject,/Delivered/);assert.ok(forOrder.every(m=>m.to===order.email));
  await deliverOrderEmails(db,sender);assert.equal(messages.filter(m=>m.subject.includes(order.order_number)).length,5);
});
test('failed email delivery stays queued and retries, and message HTML escapes user input',async()=>{
  const created=await call('/orders','POST',input);const id=created.body.data.id;
  const sender={from:'test@example.test',send:async()=>{throw new Error('Temporary SMTP failure');}};
  await deliverOrderEmails(db,sender);const order=await db.collection('orders').findOne({id});const event=order.email_notifications[0];assert.equal(event.state,'pending');assert.equal(event.attempts,1);
  await db.collection('orders').updateOne({id},{ $set:{'email_notifications.0.next_attempt':new Date(0).toISOString()} });
  await deliverOrderEmails(db,{from:'test@example.test',send:async()=>{}});assert.equal((await db.collection('orders').findOne({id})).email_notifications[0].state,'sent');
  const message=orderMessage({...order,first_name:'<script>alert(1)</script>'},event,'test@example.test');assert.ok(!message.html.includes('<script>'));assert.ok(message.html.includes('&lt;script&gt;'));
});
