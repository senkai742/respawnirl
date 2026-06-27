-- Add 'skip' status to quest logs
ALTER TABLE public.quest_logs DROP CONSTRAINT IF EXISTS quest_logs_status_check;
ALTER TABLE public.quest_logs ADD CONSTRAINT quest_logs_status_check CHECK (status IN ('completed', 'failed', 'skip'));
