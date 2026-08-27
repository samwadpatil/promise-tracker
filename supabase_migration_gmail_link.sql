-- Run in Supabase SQL Editor to add direct Gmail link support and fix duplicates
alter table promises add column if not exists gmail_rfc_id text;
-- Optional: add index for faster deletes
create index if not exists idx_promises_user_gmail_rfc on promises(user_id, gmail_rfc_id);

-- Also ensure grants still ok after migration
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
