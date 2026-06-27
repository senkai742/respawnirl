-- Update quests table to new structure
ALTER TABLE quests 
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'Easy',
  ADD COLUMN IF NOT EXISTS default_unit_type text DEFAULT 'binary',
  ADD COLUMN IF NOT EXISTS default_target integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS default_operator text DEFAULT '>=';

-- Update quest_logs table
ALTER TABLE quest_logs 
  ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'binary',
  ADD COLUMN IF NOT EXISTS metric_current integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metric_target integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metric_operator text DEFAULT '>=';

-- Update status check to include 'active' and 'skip'
ALTER TABLE quest_logs 
  DROP CONSTRAINT IF EXISTS quest_logs_status_check;
ALTER TABLE quest_logs 
  ADD CONSTRAINT quest_logs_status_check CHECK (status IN ('active', 'completed', 'failed', 'skip'));

-- Set default status to 'active'
ALTER TABLE quest_logs 
  ALTER COLUMN status SET DEFAULT 'active';
