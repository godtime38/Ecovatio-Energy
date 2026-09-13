create table if not exists public.cms_entries (
  id text primary key,
  kind text not null check (kind in ('product','project')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  draft jsonb not null,
  published jsonb,
  revision integer not null check (revision > 0),
  updated_at timestamptz not null default now(),
  unique(kind, slug)
);
alter table public.cms_entries enable row level security;
-- No browser access to records or drafts. Only the server service role can read/write.
revoke all on public.cms_entries from anon, authenticated;
grant select, insert, update, delete on public.cms_entries to service_role;
create table if not exists public.cms_history (
  history_id bigint generated always as identity primary key,
  entry_id text not null,
  snapshot jsonb not null,
  saved_at timestamptz not null default now()
);
alter table public.cms_history enable row level security;
revoke all on public.cms_history from anon, authenticated;
grant select on public.cms_history to service_role;
create or replace function public.cms_save_history() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.cms_history(entry_id,snapshot) values (old.id,to_jsonb(old));
  return new;
end;
$$;
drop trigger if exists cms_history_before_update on public.cms_entries;
create trigger cms_history_before_update before update on public.cms_entries for each row execute function public.cms_save_history();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('ecovatio-media','ecovatio-media',true,2000000,array['image/webp','application/pdf'])
on conflict(id) do nothing;
-- Uploads go through the authenticated server. No anonymous write policies.
