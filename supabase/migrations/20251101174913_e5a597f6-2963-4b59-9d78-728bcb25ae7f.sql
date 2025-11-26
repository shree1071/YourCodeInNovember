-- Create chat_messages table to store conversations with sentiment data
CREATE TABLE public.chat_messages (
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
CREATE POLICY "Users can view their own messages"
  ON public.chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create community_posts table for anonymous posting
CREATE TABLE public.community_posts (
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
CREATE POLICY "Anyone can view posts"
  ON public.community_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.community_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create post_reactions table
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'support', 'hug')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON public.post_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add reactions"
  ON public.post_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_chat_messages_user_created ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX idx_post_reactions_post ON public.post_reactions(post_id);