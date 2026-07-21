-- Execute este arquivo no SQL Editor de um projeto Supabase novo.
-- A autorização nunca depende de dados editáveis no navegador.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_unique on public.profiles (lower(email));
create unique index if not exists profiles_username_unique on public.profiles (lower(username));

alter table public.profiles enable row level security;

create or replace function public.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmed boolean := new.email_confirmed_at is not null;
  chosen_username text := coalesce(
    nullif(lower(new.raw_user_meta_data ->> 'username'), ''),
    'usuario_' || left(replace(new.id::text, '-', ''), 10)
  );
begin
  insert into public.profiles (
    id, email, username, display_name, role,
    trial_started_at, trial_ends_at, created_at, updated_at
  ) values (
    new.id,
    lower(new.email),
    chosen_username,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    case
      when confirmed and lower(new.email) = 'eduardo.emilio.gomes@gmail.com' then 'admin'
      else 'user'
    end,
    case when confirmed then now() else null end,
    case when confirmed then now() + interval '7 days' else null end,
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(nullif(lower(new.raw_user_meta_data ->> 'username'), ''), public.profiles.username),
    display_name = coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), public.profiles.display_name),
    role = case
      when confirmed and lower(new.email) = 'eduardo.emilio.gomes@gmail.com' then 'admin'
      else 'user'
    end,
    trial_started_at = coalesce(public.profiles.trial_started_at, case when confirmed then now() else null end),
    trial_ends_at = coalesce(public.profiles.trial_ends_at, case when confirmed then now() + interval '7 days' else null end),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
after insert or update of email, email_confirmed_at, raw_user_meta_data
on auth.users
for each row execute procedure public.sync_user_profile();

-- Cria perfis para contas que já existiam antes da instalação deste esquema.
insert into public.profiles (id, email, username, display_name, role, trial_started_at, trial_ends_at, created_at, updated_at)
select
  users.id,
  lower(users.email),
  coalesce(nullif(lower(users.raw_user_meta_data ->> 'username'), ''), 'usuario_' || left(replace(users.id::text, '-', ''), 10)),
  nullif(users.raw_user_meta_data ->> 'display_name', ''),
  case when users.email_confirmed_at is not null and lower(users.email) = 'eduardo.emilio.gomes@gmail.com' then 'admin' else 'user' end,
  case when users.email_confirmed_at is not null then now() else null end,
  case when users.email_confirmed_at is not null then now() + interval '7 days' else null end,
  coalesce(users.created_at, now()),
  now()
from auth.users as users
on conflict (id) do nothing;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and lower(email) = 'eduardo.emilio.gomes@gmail.com'
  );
$$;

create or replace function public.current_user_has_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and (
        (role = 'admin' and lower(email) = 'eduardo.emilio.gomes@gmail.com')
        or trial_ends_at > now()
      )
  );
$$;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Administrator can read profiles" on public.profiles;
create policy "Administrator can read profiles"
on public.profiles for select
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Users can update their own public fields" on public.profiles;
create policy "Users can update their own public fields"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (username, display_name, updated_at) on table public.profiles to authenticated;

revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_has_access() from public;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_has_access() to authenticated;

