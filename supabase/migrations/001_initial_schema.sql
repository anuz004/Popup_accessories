create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 120),
  line text not null check (length(line) between 1 and 80), category text not null,
  gender text not null, price integer not null check (price > 0), original_price integer check (original_price > 0),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5), reviews integer not null default 0 check (reviews >= 0),
  badge text, style text not null default 'classic', case_color text not null default '#C9A961',
  dial_color text not null default '#0F0F10', accent text not null default '#D4AF37', movement text not null,
  water_resistance text not null default '', dial text not null default '', case_material text not null default '',
  strap_material text not null default '', case_size text not null default '', description text not null default '',
  short text not null default '', image_url text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(), title text not null check (length(title) between 1 and 120),
  code text unique, discount_type text not null check (discount_type in ('percent','flat')),
  discount_value numeric not null check (discount_value > 0), scope text not null check (scope in ('all','category','product')),
  target text, active boolean not null default true, starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz not null default now(), check (scope = 'all' or target is not null),
  check (discount_type <> 'percent' or discount_value <= 100), check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), order_number text not null unique, items jsonb not null,
  first_name text not null, last_name text not null, phone text not null, email text not null, address text not null,
  state text not null, city text not null, pincode text not null, subtotal integer not null check (subtotal >= 0),
  shipping integer not null check (shipping >= 0), discount integer not null check (discount >= 0), total integer not null check (total >= 0),
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Shipped','Delivered','Cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) <= 254), phone text check (length(phone) <= 30),
  message text not null check (length(message) between 1 and 4000), status text not null default 'new', created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(), email text not null unique check (length(email) <= 254),
  active boolean not null default true, created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "public reads active products" on public.products for select using (active or public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads active offers" on public.offers for select using (active or public.is_admin());
create policy "admins manage offers" on public.offers for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read orders" on public.orders for select using (public.is_admin());
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "anyone sends contact messages" on public.contact_messages for insert with check (true);
create policy "admins manage contact messages" on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());
create policy "anyone subscribes" on public.newsletter_subscribers for insert with check (active = true);
create policy "admins manage subscribers" on public.newsletter_subscribers for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.place_order(customer jsonb, cart_items jsonb, coupon text default null)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  item jsonb; p products%rowtype; offer offers%rowtype; coupon_offer offers%rowtype;
  qty integer; unit_price integer; line_total integer; eligible_subtotal integer := 0;
  subtotal_value integer := 0; discount_value integer := 0; shipping_value integer := 0;
  order_items jsonb := '[]'::jsonb; saved orders%rowtype;
begin
  if jsonb_typeof(cart_items) <> 'array' or jsonb_array_length(cart_items) = 0 or jsonb_array_length(cart_items) > 50 then
    raise exception 'Your bag must contain between 1 and 50 items';
  end if;
  if coalesce(customer->>'first_name','') = '' or coalesce(customer->>'last_name','') = ''
     or coalesce(customer->>'phone','') !~ '^[0-9]{10}$' or coalesce(customer->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or coalesce(customer->>'address','') = '' or coalesce(customer->>'state','') = '' or coalesce(customer->>'city','') = ''
     or coalesce(customer->>'pincode','') !~ '^[0-9]{6}$' then raise exception 'Invalid customer or delivery details'; end if;

  if coupon is not null then
    select * into coupon_offer from offers where upper(code) = upper(coupon) and active
      and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()) limit 1;
    if not found then raise exception 'Invalid or expired coupon code'; end if;
  end if;

  for item in select * from jsonb_array_elements(cart_items) loop
    qty := (item->>'qty')::integer;
    if qty < 1 or qty > 9 then raise exception 'Item quantity must be between 1 and 9'; end if;
    select * into p from products where id::text = item->>'product_id' and active;
    if not found then raise exception 'A product is unavailable'; end if;
    unit_price := p.price;
    for offer in select * from offers where active and code is null
      and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
      and (scope = 'all' or (scope = 'category' and target = p.category) or (scope = 'product' and target = p.id::text)) loop
      unit_price := least(unit_price, case when offer.discount_type = 'percent'
        then round(p.price * (1 - offer.discount_value / 100.0))::integer
        else greatest(0, p.price - offer.discount_value::integer) end);
    end loop;
    line_total := unit_price * qty;
    subtotal_value := subtotal_value + line_total;
    if coupon is not null and (coupon_offer.scope = 'all' or (coupon_offer.scope = 'category' and coupon_offer.target = p.category)
       or (coupon_offer.scope = 'product' and coupon_offer.target = p.id::text)) then eligible_subtotal := eligible_subtotal + line_total; end if;
    order_items := order_items || jsonb_build_array(jsonb_build_object('product_id',p.id,'name',p.name,'price',unit_price,'qty',qty));
  end loop;

  if coupon is not null and eligible_subtotal = 0 then raise exception 'This coupon does not apply to the items in your bag'; end if;
  if coupon is not null then discount_value := case when coupon_offer.discount_type = 'percent'
    then round(eligible_subtotal * coupon_offer.discount_value / 100.0)::integer
    else least(eligible_subtotal, coupon_offer.discount_value::integer) end; end if;
  if subtotal_value - discount_value < 5000 then shipping_value := 99; end if;

  insert into orders (order_number,items,first_name,last_name,phone,email,address,state,city,pincode,subtotal,shipping,discount,total)
  values ('PA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)), order_items, trim(customer->>'first_name'), trim(customer->>'last_name'),
    customer->>'phone', lower(customer->>'email'), trim(customer->>'address'), trim(customer->>'state'), trim(customer->>'city'), customer->>'pincode',
    subtotal_value, shipping_value, discount_value, subtotal_value - discount_value + shipping_value) returning * into saved;
  return to_jsonb(saved);
end $$;

revoke all on function public.place_order(jsonb,jsonb,text) from public;
grant execute on function public.place_order(jsonb,jsonb,text) to anon, authenticated;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.products, public.offers to anon, authenticated;
grant insert on public.contact_messages, public.newsletter_subscribers to anon, authenticated;
grant select, insert, update, delete on public.products, public.offers, public.orders, public.contact_messages, public.newsletter_subscribers to authenticated;
