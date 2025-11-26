-- ============================================
-- Complete Database Setup for OPEC App
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Migration 1: Chat messages and community posts
-- Create chat_messages table to store conversations with sentiment data
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
CREATE POLICY "Users can view their own messages"
  ON public.chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own messages" ON public.chat_messages;
CREATE POLICY "Users can create their own messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create community_posts table for anonymous posting
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood_category TEXT NOT NULL CHECK (mood_category IN ('happy', 'low', 'motivation', 'anxious', 'grateful')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - everyone can view, but posts are anonymous
DROP POLICY IF EXISTS "Anyone can view posts" ON public.community_posts;
CREATE POLICY "Anyone can view posts"
  ON public.community_posts
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
CREATE POLICY "Users can create posts"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.community_posts;
CREATE POLICY "Users can delete their own posts"
  ON public.community_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create post_reactions table
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'support', 'hug')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
CREATE POLICY "Anyone can view reactions"
  ON public.post_reactions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON public.post_reactions;
CREATE POLICY "Users can add reactions"
  ON public.post_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their reactions" ON public.post_reactions;
CREATE POLICY "Users can remove their reactions"
  ON public.post_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);

-- Migration 2: Profiles, check_ins, and direct_messages
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create check_ins table
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood integer NOT NULL CHECK (mood >= 0 AND mood <= 10),
  gratitude text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on check_ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Check-ins policies
DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
CREATE POLICY "Users can view their own check-ins"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own check-ins" ON public.check_ins;
CREATE POLICY "Users can create their own check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on direct_messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Direct messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
CREATE POLICY "Users can view their own messages"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
CREATE POLICY "Users can send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update messages they received" ON public.direct_messages;
CREATE POLICY "Users can update messages they received"
  ON public.direct_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Add parent_id to community_posts for comment threading
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS author_name text;

-- Update community_posts policies to support profile names
DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON public.check_ins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_parent ON public.community_posts(parent_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migration 3: Mood check-ins extension
-- Add fields for richer mood insights to existing check_ins table
ALTER TABLE public.check_ins
ADD COLUMN IF NOT EXISTS mood_emoji text,
ADD COLUMN IF NOT EXISTS emotion_label text,
ADD COLUMN IF NOT EXISTS reflection text,
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS ai_suggestions text;

-- Table to store per-user mood streaks (cached for fast dashboard display)
CREATE TABLE IF NOT EXISTS public.mood_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_checkin_date date,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mood_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mood streaks" ON public.mood_streaks;
CREATE POLICY "Users can view their own mood streaks"
  ON public.mood_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own mood streaks" ON public.mood_streaks;
CREATE POLICY "Users can insert their own mood streaks"
  ON public.mood_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own mood streaks" ON public.mood_streaks;
CREATE POLICY "Users can update their own mood streaks"
  ON public.mood_streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger function to update streaks when a new check-in is inserted
CREATE OR REPLACE FUNCTION public.update_mood_streaks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_last_date date;
  v_current integer;
  v_longest integer;
  v_today date := (new.created_at at time zone 'utc')::date;
BEGIN
  SELECT last_checkin_date, current_streak, longest_streak
  INTO v_last_date, v_current, v_longest
  FROM public.mood_streaks
  WHERE user_id = new.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First check-in for this user
    INSERT INTO public.mood_streaks (user_id, current_streak, longest_streak, last_checkin_date)
    VALUES (new.user_id, 1, 1, v_today);
    RETURN new;
  END IF;

  -- Same day: do not change streak, just update last_checkin_date
  IF v_last_date = v_today THEN
    UPDATE public.mood_streaks
    SET last_checkin_date = v_today,
        updated_at = now()
    WHERE user_id = new.user_id;
    RETURN new;
  END IF;

  -- Consecutive day: increment streak
  IF v_last_date = v_today - 1 THEN
    v_current := v_current + 1;
  ELSE
    -- Gap: reset streak
    v_current := 1;
  END IF;

  IF v_current > v_longest THEN
    v_longest := v_current;
  END IF;

  UPDATE public.mood_streaks
  SET current_streak = v_current,
      longest_streak = v_longest,
      last_checkin_date = v_today,
      updated_at = now()
  WHERE user_id = new.user_id;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS tr_update_mood_streaks ON public.check_ins;
CREATE TRIGGER tr_update_mood_streaks
  AFTER INSERT ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mood_streaks();

-- Table for daily reminder preferences
CREATE TABLE IF NOT EXISTS public.mood_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  reminder_time_utc time with time zone NOT NULL,
  timezone text,
  is_active boolean DEFAULT true,
  last_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mood_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reminders" ON public.mood_reminders;
CREATE POLICY "Users can view their own reminders"
  ON public.mood_reminders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.mood_reminders;
CREATE POLICY "Users can insert their own reminders"
  ON public.mood_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reminders" ON public.mood_reminders;
CREATE POLICY "Users can update their own reminders"
  ON public.mood_reminders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.mood_reminders;
CREATE POLICY "Users can delete their own reminders"
  ON public.mood_reminders FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mood_reminders_user_id ON public.mood_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_reminders_active_time ON public.mood_reminders(is_active, reminder_time_utc);

-- ============================================
-- Setup Complete!
-- ============================================

