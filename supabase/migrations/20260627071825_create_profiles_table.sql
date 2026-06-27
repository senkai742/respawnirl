-- 1. Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  age integer,
  weight integer,
  height integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 2. Create a trigger function that automatically copies data from auth.users
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, age, weight, height)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'age')::integer,
    (new.raw_user_meta_data->>'weight')::integer,
    (new.raw_user_meta_data->>'height')::integer
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Attach the trigger to the auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
