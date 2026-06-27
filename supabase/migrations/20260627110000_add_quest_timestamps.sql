-- Add completed_at and failed_at timestamps to quests table
alter table public.quests
add column completed_at timestamp with time zone,
add column failed_at timestamp with time zone;
