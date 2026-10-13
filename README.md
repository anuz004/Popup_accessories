# Grand Hour

Watch storefront and admin dashboard built with React, TypeScript, Vite, and a Node/Express API backed by MongoDB Atlas.

Contact: grandhour01@gmail.com · 6369772594.

## Local setup

1. Run `npm ci`.
2. Copy `server/.env.example` to `server/.env` if it does not already exist.
3. Set `MONGODB_URI` to the connection string for your existing Atlas cluster and `MONGODB_DATABASE=grand_hour`. Your Atlas database user needs read/write access to this database, and Atlas network access must allow the API server's IP.
4. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (bcrypt hash, not a plaintext password), and a random `SESSION_SECRET` of at least 32 characters. The existing local `server/.env` already contains the configured admin email, password hash, and session secret. These values are ignored by Git.
5. Start the API with `npm run server` and the frontend with `npm run dev` in separate terminals.
6. Open `http://localhost:5173/#/admin` and sign in using the configured website admin email and password.

The API creates the `grand_hour` collections and indexes and inserts the initial admin account once Atlas connects. Existing admin passwords are not overwritten on restart. Add products using the dashboard. The storefront displays sample products only if the API cannot fetch the catalogue; checkout requires an active database connection.

The Gmail address is used as a public contact and admin identifier. Sending messages through Gmail is not configured; contact form submissions are stored in MongoDB and appear in the admin inbox.

## Commands

- `npm run dev`: Vite frontend; `/api` requests are proxied to port 3001.
- `npm run server`: MongoDB API.
- `npm run build`: TypeScript check and production frontend build.
- `npm run lint`: Static analysis.
- `npm run test:server`: API integration tests against a temporary MongoDB instance. Test data is separate from Atlas.
- `npm start`: Serve the API and built frontend together in production.

## Deployment

For Netlify frontend deployment with a separate Node backend, follow [DEPLOYMENT.md](DEPLOYMENT.md). It includes Netlify API proxy setup, a Docker backend option, Atlas environment settings, and production acceptance checks for your teammate.

Build the frontend, configure the server environment, and deploy this as a Node application with HTTPS. Set `HOST=0.0.0.0`, `SITE_ORIGIN` to the public website origin, and `NODE_ENV=production` (set automatically by `npm start`). The production API uses secure, HTTP-only cookies and requires a proxy that terminates HTTPS. Database credentials, password hashes, and session secrets must stay server-side and must never use a `VITE_` prefix.

The server validates admin access for private collections and every product, offer, and order-status mutation. Checkout recomputes prices and discounts from MongoDB records. Sessions persist in MongoDB and expire after eight hours. Browser demo credentials and Supabase connections have been removed.

## Product photos

The product editor accepts up to five JPG, PNG, or WebP uploads, or HTTP/HTTPS photo URLs. Uploaded originals can be up to 10 MB; the browser prepares them at up to 1600 pixels and uploads files of up to 1 MB each. Photos are stored in MongoDB GridFS (`product_photos.files` and `product_photos.chunks`) and served by the API. No local upload folder is required.

The first photo is used on catalogue cards, quick view, cart, and checkout. Use Set as cover to reorder it. Product detail pages show all five photos with thumbnail selection and swipe navigation. Removing a photo removes its product reference; stored files are retained so shared image URLs are not broken.

## Customer Google sign-in and order emails

Customer sign-in is available at `/#/account`, with a Google sign-in link at checkout. It never grants administrator privileges. Customer order history only returns orders owned by the signed-in customer; the server uses the verified Google email for signed-in orders. Guest checkout remains available.

Create a Google OAuth Web application client, and configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `server/.env`. The local authorized callback URI is `http://127.0.0.1:5173/api/auth/google/callback`; configure an exact HTTPS callback URI for production. Set `SITE_ORIGIN` to the same frontend origin. OAuth uses state, nonce, PKCE, verified Google ID tokens, and session regeneration. Cookies use SameSite=Lax so the cross-site Google callback can retain its state; write endpoints still validate origins and require JSON.

For Gmail notifications, enable Google 2-Step Verification and create an app password for `grandhour01@gmail.com`. Configure `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, and `EMAIL_FROM` on the server. Do not use the website administrator password for SMTP. Restart the API after changing these values.

Each new order stores a queued order-placement email atomically with the order. Every actual status change queues an email for Confirmed, Shipped, Delivered, or Cancelled. Repeating the same status does not queue another message. The email worker sends through Gmail and retries temporary failures with backoff. Pending notifications survive restarts and remain queued if SMTP is not configured. A stable Message-ID is reused on retries; SMTP cannot guarantee exactly-once delivery if the process stops after Gmail accepts a message but before MongoDB records the acknowledgement. No SMS or WhatsApp notifications are sent. Admin sign-in remains email/password.

The additional authentication/email tests use a simulated Google identity provider and captured emails, so they do not send real emails or sign in to real Google accounts. Real provider activation requires the credentials above.
