-- Create user mapping table for Clerk users
CREATE TABLE IF NOT EXISTS public.clerk_user_mappings (
  clerk_user_id text PRIMARY KEY,
  supabase_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clerk_user_mappings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own mapping
CREATE POLICY "Users can view their own mapping"
  ON public.clerk_user_mappings FOR SELECT
  USING (auth.uid() = supabase_user_id);

-- Function to get or create Supabase user for Clerk user
CREATE OR REPLACE FUNCTION public.get_or_create_supabase_user_for_clerk(
  p_clerk_user_id text,
  p_email text,
  p_full_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_user_id uuid;
  v_existing_user_id uuid;
BEGIN
  -- Check if mapping exists
  SELECT supabase_user_id INTO v_supabase_user_id
  FROM public.clerk_user_mappings
  WHERE clerk_user_id = p_clerk_user_id;

  IF v_supabase_user_id IS NOT NULL THEN
    RETURN v_supabase_user_id;
  END IF;

  -- Check if Supabase user with this email exists
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL THEN
    -- Create mapping
    INSERT INTO public.clerk_user_mappings (clerk_user_id, supabase_user_id, email)
    VALUES (p_clerk_user_id, v_existing_user_id, p_email)
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET supabase_user_id = v_existing_user_id, updated_at = now();
    RETURN v_existing_user_id;
  END IF;

  -- Create new Supabase user (requires admin privileges)
  -- Note: This will fail if not run with service role
  -- For now, return NULL and handle in application
  RETURN NULL;
END;
$$;

-- Function to insert check-in for Clerk user
CREATE OR REPLACE FUNCTION public.insert_checkin_for_clerk(
  p_clerk_user_id text,
  p_email text,
  p_full_name text,
  p_mood integer,
  p_mood_emoji text,
  p_emotion_label text,
  p_gratitude text,
  p_reflection text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_user_id uuid;
  v_checkin_id uuid;
BEGIN
  -- Get or create Supabase user
  v_supabase_user_id := public.get_or_create_supabase_user_for_clerk(
    p_clerk_user_id,
    p_email,
    p_full_name
  );

  IF v_supabase_user_id IS NULL THEN
    RAISE EXCEPTION 'Failed to get or create Supabase user for Clerk user';
  END IF;

  -- Insert check-in using the Supabase user ID
  INSERT INTO public.check_ins (
    user_id,
    mood,
    mood_emoji,
    emotion_label,
    gratitude,
    reflection
  )
  VALUES (
    v_supabase_user_id,
    p_mood,
    p_mood_emoji,
    p_emotion_label,
    p_gratitude,
    p_reflection
  )
  RETURNING id INTO v_checkin_id;

  RETURN v_checkin_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_supabase_user_for_clerk TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_checkin_for_clerk TO authenticated;

