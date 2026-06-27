-- Fuel Targets Table
create table public.fuel_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  calories integer not null default 2000,
  protein integer not null default 130,
  carbs integer not null default 220,
  fat integer not null default 65,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Enable RLS
alter table public.fuel_targets enable row level security;

create policy "Users can manage their own fuel targets." on public.fuel_targets
  for all using (auth.uid() = user_id);

-- Fuel Logs Table
create table public.fuel_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  name text not null,
  calories integer not null default 0,
  protein integer not null default 0,
  carbs integer not null default 0,
  fat integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.fuel_logs enable row level security;

create policy "Users can manage their own fuel logs." on public.fuel_logs
  for all using (auth.uid() = user_id);
