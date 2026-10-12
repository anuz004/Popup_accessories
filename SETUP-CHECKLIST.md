# Popup Accessories — Launch Checklist

The frontend is complete and runs with an offline sample catalogue. Complete the following steps to enable real admin access, products, orders, messages and deployment.

## 1. Create the Supabase backend

- Create a new Supabase project.
- Open the Supabase SQL Editor.
- Run `supabase/migrations/001_initial_schema.sql`.
- Confirm these tables exist:
  - `products`
  - `offers`
  - `orders`
  - `contact_messages`
  - `newsletter_subscribers`
  - `admin_users`
- Confirm the functions `place_order` and `is_admin` exist.

## 2. Configure the project

- Copy `.env.example` to `.env`.
- Add the new `VITE_SUPABASE_URL`.
- Add the new `VITE_SUPABASE_ANON_KEY`.
- Add the real store phone number, email, hours and address.
- Never commit or publicly share the `.env` file.

## 3. Create the administrator

- In Supabase, open Authentication → Users.
- Create the desired admin email and password.
- Copy the new user's UUID.
- Run this query in the SQL Editor, replacing the example UUID:

```sql
insert into public.admin_users (user_id)
values ('ADMIN_USER_UUID');
```

- Open `/#/admin` and confirm the account can sign in.
- Do not reuse the password included in the old prototype archive.

## 4. Add the real catalogue

- Sign in to Admin → Products.
- Add each real product with its name, collection, category, price and specifications.
- Add a publicly accessible HTTPS image URL for each product.
- Set only products ready for sale to **Live**.
- Confirm live products appear in the storefront.

The current admin accepts image URLs. Direct file uploads require a Supabase Storage bucket and an upload control, which are not included yet.

## 5. Configure offers

- Create any automatic or coupon offers in Admin → Offers.
- Select whether each offer applies storewide, to one category or to one product.
- Test every coupon with eligible and ineligible products.
- Confirm percentage discounts never exceed 100%.

## 6. Test orders

- Add a live database product to the cart.
- Complete checkout using a valid 10-digit phone number and 6-digit Indian pincode.
- Confirm the success page shows an order number.
- Open Admin → Orders.
- Confirm the new order and customer details appear.
- Change its status through Pending → Confirmed → Shipped → Delivered.
- Refresh the page and confirm the saved status remains.
- Test a coupon order and verify subtotal, discount, shipping and total.

## 7. Test customer forms

- Submit the Contact form.
- Confirm the message appears in Admin → Inbox.
- Mark the message as resolved.
- Subscribe with an email address from the homepage or footer.
- Confirm the address appears in the newsletter subscriber list.

## 8. Replace business information

- Confirm the store address.
- Add the real phone number.
- Add the monitored customer-support email.
- Confirm business hours.
- Review delivery estimates, warranty language, returns policy, privacy policy and terms with the business owner.
- Replace sample testimonials and statistics if they are not verified.

## 9. Final technical checks

Run:

```bash
npm install
npm run build
npm run lint
npm run preview
```

Then test desktop and mobile layouts for:

- Home and Shop
- Search and filters
- Product details and image loading
- Wishlist and cart persistence
- Coupon handling
- Checkout and order creation
- Admin login and logout
- Product, offer and order administration
- Contact and newsletter forms
- FAQ, warranty, returns, privacy and terms pages

## 10. Deploy

- Deploy the generated `dist/` folder to Vercel, Netlify or another static host.
- Add all required `VITE_*` environment variables to the hosting provider.
- Build again on the host.
- Connect the final domain.
- Test one complete order on the deployed domain.
- Verify Supabase Authentication settings allow the deployed domain.

## Required before accepting real orders

- Working Supabase project and migration
- Authorized admin account
- Real products and valid image URLs
- Correct contact information and policies
- Successful live checkout-to-admin test
- Final domain configured and tested
