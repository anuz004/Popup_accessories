import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { initializeDatabase } from './database.mjs';
import { createSecureContext } from 'node:tls';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.mjs';
import { createGoogleAuth } from './googleAuth.mjs';
import { gmailSender, startEmailWorker } from './orderEmail.mjs';
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '.env'), quiet: true });
const production = process.env.NODE_ENV === 'production';
const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error('Set SESSION_SECRET to at least 32 random characters in server/.env');
let client; let db;
if (process.env.MONGODB_URI) {
  const tlsOptions = process.env.MONGODB_TLS_MAX_VERSION === 'TLSv1.2'
    ? { secureContext: createSecureContext({ minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' }) }
    : {};
  try {
    client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, ...tlsOptions });
    await client.connect(); db = client.db(process.env.MONGODB_DATABASE || 'grand_hour');
    await initializeDatabase(db, { adminEmail: process.env.ADMIN_EMAIL, passwordHash: process.env.ADMIN_PASSWORD_HASH });
    console.log('MongoDB connected; collections and admin account are ready.');
  } catch (error) {
    await client?.close(); db = undefined;
    console.error(error.code === 8000 || error.code === 18
      ? 'Atlas rejected the database credentials. Check the database username and password in server/.env.'
      : 'MongoDB connection failed. Check server/.env and Atlas network access.');
  }
} else console.log('Atlas connection string is missing. Add MONGODB_URI to server/.env and restart.');
const sender = gmailSender(process.env);
const stopEmails = db && sender ? startEmailWorker(db, sender) : () => {};
const app = createApp(db, { secret, production, origin: process.env.SITE_ORIGIN, googleAuth: createGoogleAuth(process.env), emailEnabled: Boolean(sender) });
if (production) {
  app.use(express.static(resolve(here, '../dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve(here, '../dist/index.html')));
}
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1'), () => console.log(`Store API running on port ${port}`));
const close = () => { stopEmails(); server.close(async () => { await client?.close(); process.exit(0); }); };
process.on('SIGINT', close); process.on('SIGTERM', close);
