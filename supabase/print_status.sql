-- Print status reporting migration
-- Run once in the Supabase SQL editor.
-- (The existing `printed` boolean column already exists but was never captured
-- in a migration file — this adds richer status alongside it without touching it.)

alter table orders
  add column if not exists print_status text not null default 'pending',
  add column if not exists printed_at timestamptz,
  add column if not exists print_error text;

alter table orders drop constraint if exists orders_print_status_check;
alter table orders add constraint orders_print_status_check
  check (print_status in ('pending', 'printed', 'failed'));
