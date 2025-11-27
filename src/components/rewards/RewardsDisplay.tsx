// Rewards display component showing points, level, and progress
import { useRewards } from "@/hooks/useRewards";
import { getLevelProgress, getXPForNextLevel } from "@/lib/rewards";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Coins, Star, Zap } from "lucide-react";

export function RewardsDisplay() {
  const { rewards, loading } = useRewards();

  if (loading || !rewards) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-2 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const levelProgress = getLevelProgress(rewards.current_level, rewards.experience_points);
  const xpForNext = getXPForNextLevel(rewards.current_level, rewards.experience_points);

  return (
    <Card className="p-4 gradient-primary/10 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Level {rewards.current_level}</p>
            <p className="text-xs text-muted-foreground">{xpForNext} XP to next level</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-lg font-bold">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span>{rewards.total_points}</span>
          </div>
          <p className="text-xs text-muted-foreground">Total Points</p>
        </div>
      </div>
      <Progress value={levelProgress} className="h-2" />
    </Card>
  );
}

