export type Title = 
  | 'Main Character' 
  | 'Life Hacker' 
  | 'Procrastination King' 
  | 'Tutorial NPC'
  | 'Novice Adventurer';

export interface QuestLogForTitle {
  logDate: string;
  status: 'completed' | 'failed';
}

export interface QuestForTitle {
  logs: QuestLogForTitle[];
}

// Helper to calculate success ratio and get title
export const getTitleForQuests = (quests: QuestForTitle[]): Title => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Collect all logs from last 7 days across all quests
  const recentLogs = quests.flatMap(q => 
    q.logs.filter(log => log.logDate >= sevenDaysAgoStr)
  );

  const totalQuests = recentLogs.length;
  const successCount = recentLogs.filter(log => log.status === 'completed').length;
  
  // Calculate ratio
  const successRatio = totalQuests > 0 ? (successCount / totalQuests) * 100 : 0;

  // Safety check: At least 3 quests in 7 days for high-tier titles
  const hasEnoughQuests = totalQuests >= 3;

  if (hasEnoughQuests && successRatio >= 85) return 'Main Character';
  if (hasEnoughQuests && successRatio >= 60) return 'Life Hacker';
  if (successRatio >= 35) return 'Novice Adventurer';
  if (successRatio >= 15) return 'Procrastination King';
  return 'Tutorial NPC';
};
