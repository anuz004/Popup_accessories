# Grand Hour deployment handoff

Deploy the React frontend on Netlify and the existing Express backend on an HTTPS Node/Docker service. MongoDB Atlas already hosts the database. The backend creates required collections and indexes at startup and stores uploaded photos in Atlas GridFS. Reuse the existing `grand_hour` database to retain products, orders, photos, and administrator accounts.

The current backend runs a persistent worker for queued order emails. Deploy it as a running Node service; uploading the `server/` folder to Netlify's static publish directory does not execute it. A Netlify Functions conversion would also require changing how the worker runs and is outside this deployment configuration.

## 1. Deploy the backend

Clone https://github.com/anuz004/Popup_accessories and use the repository root as the service directory. Use Node 22.16 or a compatible newer Node 22 release.

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check: `/api/health`
- Bind address: `0.0.0.0`; use the hosting platform's `PORT`.
- Enable HTTPS through the hosting platform's reverse proxy. Production cookies require HTTPS.

Alternatively, use the included Dockerfile:

```sh
docker build -t grand-hour .
docker run --env-file /secure/path/backend.env -p 3001:3001 grand-hour
```

The image excludes `.env` files. Supply secrets using the platform's runtime environment settings or a private environment file. The container exposes port 3001 unless `PORT` is overridden. Keep at least one backend instance running to process emails promptly.

Configure these **backend runtime** settings using `server/.env.example` as a template:

| Setting | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | Hosting platform value, otherwise `3001` |
| `MONGODB_URI` | Existing Atlas connection string, supplied privately |
| `MONGODB_DATABASE` | `grand_hour` |
| `SESSION_SECRET` | Random value of at least 32 characters; keep stable across restarts and instances |
| `SITE_ORIGIN` | Final Netlify/custom-domain HTTPS origin, without a trailing slash |
| `ADMIN_EMAIL` | `grandhour01@gmail.com` |
| `ADMIN_PASSWORD_HASH` | Existing bcrypt hash, supplied privately; needed to bootstrap an admin in a new database |

Generate a new session secret if needed with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Changing it invalidates existing login sessions. The database initializer preserves existing admin passwords. Never put the database password, admin hash, OAuth secret, session secret, or SMTP password in a `VITE_` variable or commit them to Git.

In Atlas Network Access, allow the backend host's outbound IP addresses, and ensure its database user has read/write access to `grand_hour`. The backend needs outbound Atlas network access. Only set `MONGODB_TLS_MAX_VERSION=TLSv1.2` if the hosting network requires the existing local workaround; otherwise leave it unset.

Check `https://YOUR-BACKEND/api/health`: it must return HTTP 200 with `connected: true` before connecting Netlify.

## 2. Deploy the frontend on Netlify

Import the GitHub repository into Netlify. The repository itself is the base directory (the local `work/Popup_accessories` directory is not part of Git).

- Build command: `npm run build:netlify`
- Publish directory: `dist`
- Set the Netlify **build** environment variable `BACKEND_URL=https://YOUR-BACKEND`.

`netlify.toml` supplies the build settings. The build generates `dist/_redirects` with `/api/*` proxied to the backend, followed by the frontend fallback. `BACKEND_URL` must be a public HTTPS origin without credentials or an `/api` suffix. The build deliberately fails if this setting is missing or invalid. MongoDB and Gmail credentials belong on the backend, not in Netlify's frontend environment.

Keep browser requests on the Netlify origin through this proxy: administrator/customer sessions and product images use `/api` URLs. Set backend `SITE_ORIGIN` to the exact final frontend origin and restart the backend. Use a single canonical public domain for authentication; preview domains are not automatically allowed to write to the production API.

Netlify supports external API proxy rewrites: https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/

## 3. Activate customer Google login and Gmail order emails

On the backend, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and:

```text
GOOGLE_REDIRECT_URI=https://YOUR-NETLIFY-OR-CUSTOM-DOMAIN/api/auth/google/callback
```

Register that exact HTTPS callback in the Google OAuth Web application client. Complete Google's production consent configuration as required for your client. Google login is for customers; admin login remains email/password.

Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=grandhour01@gmail.com`, `SMTP_PASS` to a Gmail app password, and `EMAIL_FROM=Grand Hour <grandhour01@gmail.com>` on the backend. Restart it after changing credentials. The website admin password is not a Gmail app password.

Choose a backend plan that permits outbound SMTP. For example, Render Free web services block SMTP ports 25, 465, and 587, so the existing Gmail sender requires another compatible plan or host: https://render.com/docs/free

Google and Gmail cannot be considered active until valid provider credentials are configured and real sign-in/delivery are tested. Automated provider tests use simulated Google identities and captured email, not live delivery.

## 4. Teammate's production acceptance checks

1. Open the Netlify `/api/health` URL and confirm Atlas is connected through the proxy.
2. Sign in at `/#/admin`; refresh and confirm the authenticated session remains active. Sign out and verify private admin requests are denied.
3. Add a clearly labelled test product with five photos; confirm its cover and all gallery photos appear on the public website after refresh. Remove the test product afterward.
4. Test shopping, cart, checkout, contact form, and customer Google sign-in on the final domain. Confirm each customer sees only their own orders.
5. Place a test order using a tester-owned email. Confirm an actual order-placement email arrives, then change its status through Confirmed, Shipped, and Delivered and verify each email. Repeating the same status should not send another notification.
6. Restart the backend and verify products/photos/orders persist. Check queued email retries and host logs if delivery fails.

Do not announce real email delivery or Google activation based solely on a successful frontend deployment. Database data remains in Atlas; Git contains the connection, initialization, upload, authentication, and email code required to access it.
