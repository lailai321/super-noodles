-- Run this in Supabase SQL Editor

create sequence if not exists order_number_seq start 1;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null default nextval('order_number_seq'),
  customer_name text not null,
  customer_phone text not null,
  total_cents integer not null,
  pickup_time text not null,
  stripe_session_id text unique not null,
  status text not null default 'pending',
  acknowledged_at timestamptz,
  ready_at timestamptz,
  collected_at timestamptz,
  sms_status text not null default 'not_sent',
  sms_sent_at timestamptz,
  sms_error text,
  sms_message_id text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_uuid text not null,
  item_name text not null,
  quantity integer not null,
  unit_price_cents integer not null,
  extra_meat boolean not null default false,
  extra_vegetable boolean not null default false,
  notes text not null default ''
);

create table if not exists sold_out_items (
  item_uuid text primary key,
  item_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists menu_overrides (
  item_uuid text primary key,
  name text,
  price_cents integer,
  description text,
  is_hidden boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Index for tracking orders by phone
create index if not exists orders_phone_idx on orders(customer_phone);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists orders_status_created_idx on orders(status, created_at desc);

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'ready', 'collected'));
alter table orders drop constraint if exists orders_total_cents_check;
alter table orders add constraint orders_total_cents_check
  check (total_cents >= 0 and total_cents <= 10000000);
alter table orders drop constraint if exists orders_sms_status_check;
alter table orders add constraint orders_sms_status_check
  check (sms_status in ('not_sent', 'sending', 'sent', 'failed'));

alter table order_items drop constraint if exists order_items_quantity_check;
alter table order_items add constraint order_items_quantity_check
  check (quantity > 0 and quantity <= 20);
alter table order_items drop constraint if exists order_items_unit_price_check;
alter table order_items add constraint order_items_unit_price_check
  check (unit_price_cents >= 0 and unit_price_cents <= 100000);

-- Enable RLS but allow service role full access
alter table orders enable row level security;
alter table order_items enable row level security;
alter table sold_out_items enable row level security;
alter table menu_overrides enable row level security;

-- Public can read sold_out_items and menu_overrides
create policy "public read sold_out" on sold_out_items for select using (true);
create policy "public read overrides" on menu_overrides for select using (true);
