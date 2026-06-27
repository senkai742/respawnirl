create table public.quests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'boss')),
  status text not null default 'active',
  xp_reward integer not null,
  coin_reward integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.quests enable row level security;

-- Create Policies
create policy "Users can manage their own quests." on public.quests
  for all using (auth.uid() = user_id);
