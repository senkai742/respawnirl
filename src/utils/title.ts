export type Title = 
  | "Main Character" 
  | "Life Hacker" 
  | "Novice Adventurer" 
  | "Procrastination King" 
  | "Tutorial NPC";

export interface QuestLogForTitle {
  logDate: string;
  status: 'active' | 'completed' | 'failed' | 'skip';
}

export interface QuestForTitle {
  logs: QuestLogForTitle[];
}

// Helper to calculate success ratio and get title
export const getTitleForQuests = (quests: QuestForTitle[]): Title => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Collect all logs from last 7 days across all quests, excluding skips
  const recentLogs = quests.flatMap(q => 
    q.logs.filter(l => l.logDate >= sevenDaysAgoStr && l.status !== 'skip')
  );

  const totalQuests = recentLogs.length;
  const successCount = recentLogs.filter(l => l.status === 'completed').length;

  // Safety check: At least 3 quests to qualify for high-tier titles
  if (totalQuests < 3) {
    return "Novice Adventurer";
  }

  const successRate = successCount / totalQuests;

  if (successRate >= 0.85) {
    return "Main Character";
  } else if (successRate >= 0.60) {
    return "Life Hacker";
  } else if (successRate >= 0.35) {
    return "Novice Adventurer";
  } else if (successRate >= 0.15) {
    return "Procrastination King";
  } else {
    return "Tutorial NPC";
  }
};
