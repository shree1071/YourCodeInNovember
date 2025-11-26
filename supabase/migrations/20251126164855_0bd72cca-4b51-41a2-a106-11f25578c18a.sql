-- Create profiles table
CREATE TABLE public.profiles (
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
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create check_ins table
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood integer NOT NULL CHECK (mood >= 0 AND mood <= 10),
  gratitude text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on check_ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Check-ins policies
CREATE POLICY "Users can view their own check-ins"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create direct_messages table
CREATE TABLE public.direct_messages (
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
CREATE POLICY "Users can view their own messages"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received"
  ON public.direct_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Add parent_id to community_posts for comment threading
ALTER TABLE public.community_posts
ADD COLUMN parent_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
ADD COLUMN author_name text;

-- Update community_posts policies to support profile names
CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_created_at ON public.check_ins(created_at DESC);
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_community_posts_parent ON public.community_posts(parent_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();