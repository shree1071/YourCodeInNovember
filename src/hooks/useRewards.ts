// Custom hook for rewards system
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getUserRewards,
  getUserBadges,
  getPointsHistory,
  getDailyChallenges,
  awardPoints,
  type UserRewards,
  type UserBadge,
  type PointsHistory,
  type DailyChallenge,
} from '@/lib/rewards';

export function useRewards() {
  const { user: clerkUser } = useUser();
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  useEffect(() => {
    loadRewards();
  }, [clerkUser]);

  const loadRewards = async () => {
    if (!clerkUser && clerkEnabled) {
      setLoading(false);
      return;
    }

    try {
      // Get Supabase user ID
      let userId: string | null = null;
      
      if (clerkEnabled && clerkUser) {
        const { data: mapping } = await supabase
          .from('clerk_user_mapping')
          .select('supabase_user_id')
          .eq('clerk_user_id', clerkUser.id)
          .single();
        
        userId = mapping?.supabase_user_id || null;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      // Load all rewards data in parallel
      const [rewardsData, badgesData, historyData, challengesData] = await Promise.all([
        getUserRewards(userId),
        getUserBadges(userId),
        getPointsHistory(userId),
        getDailyChallenges(userId),
      ]);

      setRewards(rewardsData);
      setBadges(badgesData);
      setPointsHistory(historyData);
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPoints = async (
    points: number,
    reason: string,
    source: 'checkin' | 'streak' | 'badge' | 'community' | 'chat' | 'bonus'
  ) => {
    if (!clerkUser && clerkEnabled) return null;

    try {
      let userId: string | null = null;
      
      if (clerkEnabled && clerkUser) {
        const { data: mapping } = await supabase
          .from('clerk_user_mapping')
          .select('supabase_user_id')
          .eq('clerk_user_id', clerkUser.id)
          .single();
        
        userId = mapping?.supabase_user_id || null;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }

      if (!userId) return null;

      const result = await awardPoints(userId, points, reason, source);
      
      if (result) {
        // Reload rewards to get updated data
        await loadRewards();
        return result;
      }

      return null;
    } catch (error) {
      console.error('Error adding points:', error);
      return null;
    }
  };

  return {
    rewards,
    badges,
    pointsHistory,
    challenges,
    loading,
    addPoints,
    refresh: loadRewards,
  };
}

