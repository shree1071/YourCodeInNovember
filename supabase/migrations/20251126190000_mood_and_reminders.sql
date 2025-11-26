-- Mood check-ins extension: emoji palette, tone-safe feedback, and journaling

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

CREATE POLICY "Users can view their own mood streaks"
  ON public.mood_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can maintain their own mood streaks"
  ON public.mood_streaks FOR INSERT, UPDATE
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

CREATE POLICY "Users can view their own reminders"
  ON public.mood_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reminders"
  ON public.mood_reminders FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mood_reminders_user_id ON public.mood_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_reminders_active_time ON public.mood_reminders(is_active, reminder_time_utc);


