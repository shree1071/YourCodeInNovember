-- ============================================
-- OPEC Rewards System Setup
-- Run this entire file in Supabase Dashboard → SQL Editor
-- No CLI or setup required - just copy and paste!
-- ============================================

-- User points and level tracking
CREATE TABLE IF NOT EXISTS public.user_rewards (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  experience_points integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rewards" ON public.user_rewards;
CREATE POLICY "Users can view their own rewards"
  ON public.user_rewards FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rewards" ON public.user_rewards;
CREATE POLICY "Users can update their own rewards"
  ON public.user_rewards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert rewards" ON public.user_rewards;
CREATE POLICY "System can insert rewards"
  ON public.user_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Badges/Achievements
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('consistency', 'milestone', 'social', 'wellness', 'special')),
  points_required integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- User badges (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Points history for transparency
CREATE TABLE IF NOT EXISTS public.points_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points integer NOT NULL,
  reason text NOT NULL,
  source text NOT NULL CHECK (source IN ('checkin', 'streak', 'badge', 'community', 'chat', 'bonus')),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own points history" ON public.points_history;
CREATE POLICY "Users can view their own points history"
  ON public.points_history FOR SELECT
  USING (auth.uid() = user_id);

-- Daily challenges
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  points_reward integer NOT NULL DEFAULT 10,
  challenge_type text NOT NULL CHECK (challenge_type IN ('checkin', 'streak', 'community', 'reflection', 'gratitude')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL DEFAULT 1,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  date date NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, challenge_id, date)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own challenges" ON public.user_challenges;
CREATE POLICY "Users can view their own challenges"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenges" ON public.user_challenges;
CREATE POLICY "Users can update their own challenges"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_date ON public.user_challenges(user_id, date DESC);

-- Function to award points and check level up
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_points integer,
  p_reason text,
  p_source text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_points integer;
  v_new_level integer;
  v_new_xp integer;
  v_leveled_up boolean := false;
  v_current_level integer;
BEGIN
  -- Insert points history
  INSERT INTO public.points_history (user_id, points, reason, source)
  VALUES (p_user_id, p_points, p_reason, p_source);

  -- Update or create user rewards
  INSERT INTO public.user_rewards (user_id, total_points, experience_points, updated_at)
  VALUES (p_user_id, p_points, p_points, now())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_points = user_rewards.total_points + p_points,
    experience_points = user_rewards.experience_points + p_points,
    updated_at = now();

  -- Get current level and calculate new level
  SELECT current_level, experience_points INTO v_current_level, v_new_xp
  FROM public.user_rewards
  WHERE user_id = p_user_id;

  -- Level up calculation: 100 XP per level
  v_new_level = FLOOR(v_new_xp / 100) + 1;
  
  IF v_new_level > v_current_level THEN
    v_leveled_up := true;
    UPDATE public.user_rewards
    SET current_level = v_new_level
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'points', p_points,
    'total_points', (SELECT total_points FROM public.user_rewards WHERE user_id = p_user_id),
    'level', v_new_level,
    'leveled_up', v_leveled_up
  );
END;
$$;

-- Insert default badges (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'First Steps') THEN
    INSERT INTO public.badges (name, description, icon, category, points_required) VALUES
    ('First Steps', 'Complete your first check-in', '🌱', 'milestone', 0),
    ('Week Warrior', 'Complete 7 check-ins', '🔥', 'consistency', 50),
    ('Monthly Master', 'Complete 30 check-ins', '⭐', 'consistency', 200),
    ('Streak Starter', 'Maintain a 3-day streak', '📅', 'consistency', 30),
    ('Streak Champion', 'Maintain a 7-day streak', '🏆', 'consistency', 100),
    ('Streak Legend', 'Maintain a 30-day streak', '👑', 'consistency', 500),
    ('Community Helper', 'Post 5 times in community', '💬', 'social', 75),
    ('Reflection Master', 'Write 10 reflections', '📝', 'wellness', 150),
    ('Gratitude Guru', 'Write 20 gratitude entries', '🙏', 'wellness', 200),
    ('Chat Companion', 'Have 10 AI chat conversations', '🤖', 'social', 100);
  END IF;
END $$;

-- Insert default daily challenges (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.daily_challenges WHERE title = 'Daily Check-in') THEN
    INSERT INTO public.daily_challenges (title, description, points_reward, challenge_type, is_active) VALUES
    ('Daily Check-in', 'Complete your mood check-in today', 10, 'checkin', true),
    ('Gratitude Moment', 'Write a gratitude entry', 5, 'gratitude', true),
    ('Reflect & Grow', 'Add a reflection to your check-in', 5, 'reflection', true),
    ('Community Voice', 'Post in the community', 15, 'community', true),
    ('AI Chat', 'Have a conversation with AI support', 10, 'checkin', true);
  END IF;
END $$;

-- ============================================
-- Setup Complete! ✅
-- ============================================
-- Your rewards system is now ready!
-- 
-- Next steps:
-- 1. The rewards system will automatically create user_rewards
--    when users earn their first points
-- 2. Use the award_points() function to give points:
--    SELECT award_points('user-id', 10, 'Daily check-in', 'checkin');
-- 3. Check user rewards:
--    SELECT * FROM user_rewards WHERE user_id = 'user-id';
-- ============================================

