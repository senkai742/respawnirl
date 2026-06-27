-- Add player stats columns to profiles table
alter table public.profiles
add column hp integer not null default 100,
add column max_hp integer not null default 100,
add column xp integer not null default 0,
add column max_xp integer not null default 100,
add column level integer not null default 1,
add column coins integer not null default 0,
add column streak integer not null default 0,
add column title text not null default 'THE_RECRUIT';

-- Update the handle_new_user function to include default player stats
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    username,
    age,
    weight,
    height,
    hp,
    max_hp,
    xp,
    max_xp,
    level,
    coins,
    streak,
    title
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'age')::integer,
    (new.raw_user_meta_data->>'weight')::integer,
    (new.raw_user_meta_data->>'height')::integer,
    100,
    100,
    0,
    100,
    1,
    0,
    0,
    'THE_RECRUIT'
  );
  return new;
end;
$$ language plpgsql security definer;
