// Badges display component
import { useRewards } from "@/hooks/useRewards";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock } from "lucide-react";

export function BadgesDisplay() {
  const { badges, loading } = useRewards();

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Badges</h3>
        <Badge variant="secondary" className="ml-auto">
          {badges.length} earned
        </Badge>
      </div>
      {badges.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Complete activities to earn badges!
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {badges.slice(0, 8).map((userBadge) => (
            <div
              key={userBadge.id}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              title={userBadge.badge.name}
            >
              <div className="text-2xl">{userBadge.badge.icon}</div>
              <p className="text-xs text-center leading-tight">{userBadge.badge.name}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

