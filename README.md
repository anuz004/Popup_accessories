# Popup Accessories

A responsive watch storefront and admin dashboard built with React, TypeScript, Vite, Tailwind CSS and Supabase.

## Features

- Product catalogue, search, filters, product detail and quick view
- Cart and wishlist persisted in standard browser storage
- Automatic and coupon-based discounts with store, category or product scope
- Cash-on-delivery checkout with server-side price validation
- Admin product, offer, order-status and customer-inbox management
- Contact messages and newsletter subscriptions
- Hash-based deep links that work on any static host
- Offline sample catalogue when the configured backend is unavailable
- FAQ, warranty, returns, privacy and terms pages

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in the Supabase values and store contact details.
3. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql` in its SQL editor.
4. Create an admin user in Supabase Authentication, then authorize it in the SQL editor:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'your-admin@example.com';
   ```

5. Start the app: `npm run dev`

Do not commit `.env`. There is no default admin password in the source.

## Commands

- `npm run dev` — local development server
- `npm run build` — TypeScript check and production build
- `npm run lint` — static analysis
- `npm run preview` — serve the production build locally

## Backend endpoints

The frontend uses Supabase REST/Auth/RPC endpoints generated from the migration:

- `products`: public active-product reads; admin create/update/delete
- `offers`: public active-offer reads; admin create/update/delete
- `place_order(customer, cart_items, coupon)`: public RPC that validates products, quantities, discounts, shipping and totals on the server
- `orders`: admin read and status update; direct public writes are blocked
- `contact_messages`: public insert; admin read/update
- `newsletter_subscribers`: public insert; admin read
- Supabase Auth password sign-in plus `is_admin()` authorization

Row Level Security is enabled on every application table. Merely having a Supabase account does not grant dashboard access; the user must also exist in `admin_users`.

## Deployment

Run `npm run build` and deploy `dist/` to any static host. Configure the same `VITE_*` values from `.env.example` in the host. Because navigation uses hash routes, no rewrite rule is required.

## Operational notes

- Add live products (and optional image URLs) in the admin dashboard after the backend is configured.
- The included sample catalogue is display-only and appears only when the live product request fails.
- Confirm the store phone, email and hours before launch by setting the corresponding environment variables.
