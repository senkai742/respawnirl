-- Create quest logs table
CREATE TABLE public.quest_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one log per quest per day per user
  UNIQUE(quest_id, user_id, log_date)
);

-- Row Level Security
ALTER TABLE public.quest_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quest logs" ON public.quest_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quest logs" ON public.quest_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quest logs" ON public.quest_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quest logs" ON public.quest_logs
  FOR DELETE USING (auth.uid() = user_id);
