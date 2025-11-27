// Rewards system utilities and types
import { supabase } from "@/integrations/supabase/client";

export interface UserRewards {
  total_points: number;
  current_level: number;
  experience_points: number;
  coins: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'consistency' | 'milestone' | 'social' | 'wellness' | 'special';
  points_required: number;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  earned_at: string;
}

export interface PointsHistory {
  id: string;
  points: number;
  reason: string;
  source: 'checkin' | 'streak' | 'badge' | 'community' | 'chat' | 'bonus';
  created_at: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  challenge_type: 'checkin' | 'streak' | 'community' | 'reflection' | 'gratitude';
  progress?: number;
  target?: number;
  completed?: boolean;
}

// Award points to user
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  source: 'checkin' | 'streak' | 'badge' | 'community' | 'chat' | 'bonus'
): Promise<{ points: number; total_points: number; level: number; leveled_up: boolean } | null> {
  try {
    const { data, error } = await supabase.rpc('award_points', {
      p_user_id: userId,
      p_points: points,
      p_reason: reason,
      p_source: source,
    });

    if (error) {
      console.error('Error awarding points:', error);
      return null;
    }

    return data as { points: number; total_points: number; level: number; leveled_up: boolean };
  } catch (error) {
    console.error('Error awarding points:', error);
    return null;
  }
}

// Get user rewards
export async function getUserRewards(userId: string): Promise<UserRewards | null> {
  try {
    const { data, error } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rewards record exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('user_rewards')
          .insert({ user_id: userId })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating rewards:', insertError);
          return null;
        }

        return newData as UserRewards;
      }
      console.error('Error fetching rewards:', error);
      return null;
    }

    return data as UserRewards;
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return null;
  }
}

// Get user badges
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        id,
        earned_at,
        badge:badges (
          id,
          name,
          description,
          icon,
          category,
          points_required
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching badges:', error);
      return [];
    }

    return (data || []) as UserBadge[];
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

// Get points history
export async function getPointsHistory(userId: string, limit = 20): Promise<PointsHistory[]> {
  try {
    const { data, error } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching points history:', error);
      return [];
    }

    return (data || []) as PointsHistory[];
  } catch (error) {
    console.error('Error fetching points history:', error);
    return [];
  }
}

// Get daily challenges
export async function getDailyChallenges(userId: string): Promise<DailyChallenge[]> {
  try {
    // Get active challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('is_active', true);

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      return [];
    }

    if (!challenges || challenges.length === 0) {
      return [];
    }

    // Get user progress for today
    const today = new Date().toISOString().split('T')[0];
    const { data: userChallenges, error: progressError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    const progressMap = new Map(
      (userChallenges || []).map((uc: any) => [uc.challenge_id, uc])
    );

    // Combine challenges with progress
    return (challenges || []).map((challenge: any) => ({
      ...challenge,
      progress: progressMap.get(challenge.id)?.progress || 0,
      target: progressMap.get(challenge.id)?.target || 1,
      completed: progressMap.get(challenge.id)?.completed || false,
    })) as DailyChallenge[];
  } catch (error) {
    console.error('Error fetching daily challenges:', error);
    return [];
  }
}

// Calculate XP needed for next level
export function getXPForNextLevel(currentLevel: number, currentXP: number): number {
  const xpForNextLevel = currentLevel * 100;
  return Math.max(0, xpForNextLevel - currentXP);
}

// Calculate level progress percentage
export function getLevelProgress(currentLevel: number, currentXP: number): number {
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  
  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));
}

