-- Order operations migration
-- Run once in the Supabase SQL editor.

alter table orders
  add column if not exists acknowledged_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists collected_at timestamptz,
  add column if not exists sms_status text not null default 'not_sent',
  add column if not exists sms_sent_at timestamptz,
  add column if not exists sms_error text,
  add column if not exists sms_message_id text;

create index if not exists orders_status_created_idx
  on orders(status, created_at desc);

update orders set status = 'collected' where status = 'completed';

alter table orders drop constraint if exists orders_sms_status_check;
alter table orders add constraint orders_sms_status_check
  check (sms_status in ('not_sent', 'sending', 'sent', 'failed'));

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'ready', 'collected'));

alter table orders drop constraint if exists orders_total_cents_check;
alter table orders add constraint orders_total_cents_check
  check (total_cents >= 0 and total_cents <= 10000000);

alter table order_items drop constraint if exists order_items_quantity_check;
alter table order_items add constraint order_items_quantity_check
  check (quantity > 0 and quantity <= 20);

alter table order_items drop constraint if exists order_items_unit_price_check;
alter table order_items add constraint order_items_unit_price_check
  check (unit_price_cents >= 0 and unit_price_cents <= 100000);
