create extension if not exists pgcrypto;

drop table if exists public.reviews;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null,
  duration text not null,
  centre text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  course text not null,
  centre text not null,
  start_date date not null,
  note text,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Review')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  published_at timestamptz not null default now(),
  body text not null
);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.bookings enable row level security;
alter table public.announcements enable row level security;

create policy "Profiles are viewable by everyone"
on public.profiles for select using (true);
create policy "Users can update their own profile"
on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users can insert their own profile"
on public.profiles for insert with check ((select auth.uid()) = id);

create policy "Courses are viewable by everyone"
on public.courses for select using (true);
create policy "Admins can manage courses"
on public.courses for all using ((select public.is_admin()) = true) with check ((select public.is_admin()) = true);

create policy "Users can insert their own bookings"
on public.bookings for insert with check ((select auth.uid()) = user_id);
create policy "Users can view their own bookings"
on public.bookings for select using ((select auth.uid()) = user_id);
create policy "Admins can view all bookings"
on public.bookings for select using ((select public.is_admin()) = true);

create policy "Announcements are viewable by everyone"
on public.announcements for select using (true);
create policy "Admins can manage announcements"
on public.announcements for all using ((select public.is_admin()) = true) with check ((select public.is_admin()) = true);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant usage on schema public to anon, authenticated;
grant select on public.courses to anon, authenticated;
grant select on public.announcements to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.bookings to authenticated;
grant select, insert, update, delete on public.courses, public.announcements to authenticated;