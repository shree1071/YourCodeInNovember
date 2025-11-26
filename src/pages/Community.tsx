import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, User } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  full_name: string | null;
}

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

interface Post {
  id: string;
  content: string;
  mood_category: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  author_name: string | null;
  reactions?: Reaction[];
  replies?: Post[];
}

const Community = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [selectedMood, setSelectedMood] = useState("general");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    setCurrentUserProfile(profileData);
    fetchPosts();
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    const postsWithData = await Promise.all(
      (data || []).map(async (post) => {
        // Fetch reactions
        const { data: reactions } = await supabase
          .from("post_reactions")
          .select("*")
          .eq("post_id", post.id);

        // Fetch replies
        const { data: replies } = await supabase
          .from("community_posts")
          .select("*")
          .eq("parent_id", post.id)
          .order("created_at", { ascending: true });
        
        return { 
          ...post, 
          reactions: reactions || [],
          replies: replies || []
        };
      })
    );

    setPosts(postsWithData);
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;

    const { error } = await supabase.from("community_posts").insert({
      content: newPost.trim(),
      mood_category: selectedMood,
      user_id: currentUserId,
      author_name: currentUserProfile?.full_name || "Anonymous",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Posted!",
      description: "Your post has been shared with the community",
    });

    setNewPost("");
    setSelectedMood("general");
    fetchPosts();
  };

  const handleReplySubmit = async (postId: string) => {
    if (!replyContent.trim()) return;

    const { error } = await supabase.from("community_posts").insert({
      content: replyContent.trim(),
      mood_category: "reply",
      user_id: currentUserId,
      parent_id: postId,
      author_name: currentUserProfile?.full_name || "Anonymous",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
      return;
    }

    setReplyContent("");
    setReplyingTo(null);
    fetchPosts();
  };

  const handleReaction = async (postId: string) => {
    const existingReaction = posts
      .find((p) => p.id === postId)
      ?.reactions?.find((r) => r.user_id === currentUserId);

    if (existingReaction) {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("id", existingReaction.id);
    } else {
      await supabase.from("post_reactions").insert({
        post_id: postId,
        user_id: currentUserId,
        reaction_type: "heart",
      });
    }

    fetchPosts();
  };

  const hasReacted = (post: Post) => {
    return post.reactions?.some((r) => r.user_id === currentUserId);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Community</h1>
        <p className="text-muted-foreground text-center mb-8">
          Share your thoughts and connect with others
        </p>

        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Share Your Thoughts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedMood} onValueChange={setSelectedMood}>
              <SelectTrigger>
                <SelectValue placeholder="Select mood category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="happy">Happy</SelectItem>
                <SelectItem value="anxious">Anxious</SelectItem>
                <SelectItem value="grateful">Grateful</SelectItem>
                <SelectItem value="struggling">Struggling</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share how you're feeling..."
              className="min-h-[100px]"
            />

            <Button onClick={handlePostSubmit} className="w-full">
              Post
            </Button>
          </CardContent>
        </Card>

        {posts.map((post) => (
          <Card key={post.id} className="glass-card mb-4">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {post.author_name || "Anonymous"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(post.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <span className="text-xs text-primary capitalize">{post.mood_category}</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{post.content}</p>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(post.id)}
                  className="gap-2"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      hasReacted(post) ? "fill-current text-red-500" : ""
                    }`}
                  />
                  {post.reactions?.length || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.replies?.length || 0}
                </Button>
              </div>

              {post.replies && post.replies.length > 0 && (
                <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                  {post.replies.map((reply) => (
                    <div key={reply.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {reply.author_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reply.created_at), "MMM d")}
                        </span>
                      </div>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === post.id && (
                <div className="ml-6 space-y-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReplySubmit(post.id)}>
                      Post Reply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Community;
