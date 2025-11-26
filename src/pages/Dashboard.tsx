import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useClerkSupabaseSync } from "@/hooks/useClerkSupabaseSync";
import { format } from "date-fns";

interface CheckIn {
  id: string;
  mood: number;
  gratitude: string | null;
  mood_emoji?: string | null;
  emotion_label?: string | null;
  reflection?: string | null;
  ai_summary?: string | null;
  ai_suggestions?: string | null;
  created_at: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isSynced, isSyncing } = useClerkSupabaseSync();
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [mood, setMood] = useState([3]);
  const [gratitude, setGratitude] = useState("");
  const [reflection, setReflection] = useState("");
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ avgMood: 0, count: 0 });
  const [streak, setStreak] = useState<Streak | null>(null);
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  useEffect(() => {
    if (clerkEnabled) {
      if (clerkLoaded) {
        if (clerkUser) {
          // Use Clerk user ID for Supabase queries
          fetchData(clerkUser.id);
        } else {
          navigate("/auth");
        }
      }
    } else {
      checkAuth();
    }
  }, [clerkEnabled, clerkLoaded, clerkUser, navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchData(session.user.id);
  };

  const fetchData = async (userId: string) => {
    setLoading(true);
    
    // Check today's check-in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayData } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())
      .maybeSingle();

    setTodayCheckIn(todayData);

    // Fetch recent 10 check-ins
    const { data: recentData } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    setRecentCheckIns(recentData || []);

    // Calculate weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weekData } = await supabase
      .from("check_ins")
      .select("mood")
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString());

    if (weekData && weekData.length > 0) {
      const avgMood = weekData.reduce((sum, item) => sum + item.mood, 0) / weekData.length;
      setWeeklyStats({ avgMood: Math.round(avgMood * 10) / 10, count: weekData.length });
    } else {
      setWeeklyStats({ avgMood: 0, count: 0 });
    }

    // Fetch streak
    const { data: streakData } = await supabase
      .from("mood_streaks")
      .select("current_streak,longest_streak")
      .eq("user_id", userId)
      .maybeSingle();

    if (streakData) {
      setStreak({
        current_streak: streakData.current_streak,
        longest_streak: streakData.longest_streak,
      });
    } else {
      setStreak({ current_streak: 0, longest_streak: 0 });
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    // Check if Clerk user is still syncing
    if (clerkEnabled && isSyncing) {
      toast({
        title: "Please wait",
        description: "Syncing your account with the database. Please try again in a moment.",
        variant: "default",
      });
      return;
    }

    // Get Supabase session (should exist if sync worked)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      if (clerkEnabled) {
        toast({
          title: "Account sync required",
          description: "Your account is being synced. Please wait a moment and try again, or refresh the page.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Not signed in",
          description: "Please sign in to submit a check-in.",
          variant: "destructive",
        });
        navigate("/auth");
      }
      return;
    }

    const userId = session.user.id;

    // Map slider value (1–5) to emoji
    const moodValue = mood[0];
    const emojiMap: Record<number, string> = {
      1: "😢",
      2: "😕",
      3: "😐",
      4: "🙂",
      5: "😊",
    };

    const emotionLabelMap: Record<number, string> = {
      1: "Very low",
      2: "Low",
      3: "Neutral",
      4: "Positive",
      5: "Very positive",
    };

    const { data, error } = await supabase.from("check_ins").insert({
      user_id: userId,
      mood: moodValue,
      mood_emoji: emojiMap[moodValue],
      emotion_label: emotionLabelMap[moodValue],
      gratitude: gratitude.trim() || null,
      reflection: reflection.trim() || null,
    }).select().maybeSingle();

    if (error) {
      console.error("Supabase insert error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit check-in. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Check-in submitted!",
      description: "Your daily check-in has been recorded.",
    });

    // Call Gemini insights function in the background
    if (data?.id) {
      setInsightsLoading(true);
      try {
        await supabase.functions.invoke("mood-checkin-ai", {
          body: {
            userId: userId,
            checkInId: data.id,
          },
        });
      } catch (err) {
        console.error("Failed to fetch mood insights", err);
      } finally {
        setInsightsLoading(false);
        // Refresh data so new AI insights appear
        fetchData(userId);
      }
    } else {
      fetchData(userId);
    }
    setMood([3]);
    setGratitude("");
    setReflection("");
  };

  const getMoodEmoji = (moodValue: number) => {
    if (moodValue <= 1) return "😢";
    if (moodValue === 2) return "😕";
    if (moodValue === 3) return "😐";
    if (moodValue === 4) return "🙂";
    return "😊";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2 text-center">Mood Insights</h1>
        <p className="text-muted-foreground text-center mb-8">
          A gentle daily check-in with mood, streaks, and reflections.
        </p>

        {clerkEnabled && !isSynced && !isSyncing && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                <strong>Account sync required:</strong> Your Clerk account needs to be synced with the database to save check-ins.
              </p>
              <Button
                onClick={async () => {
                  const email = clerkUser?.emailAddresses[0]?.emailAddress;
                  if (!email) return;
                  
                  const deterministicPassword = `clerk_${clerkUser?.id}_sync_2024`;
                  const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password: deterministicPassword,
                  });
                  
                  if (error) {
                    toast({
                      title: "Sync failed",
                      description: "Please sign up manually using the Supabase auth tab, or contact support.",
                      variant: "destructive",
                    });
                  } else {
                    window.location.reload();
                  }
                }}
                variant="outline"
                size="sm"
              >
                Sync Account Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Today's Check-In */}
        <Card className="mb-8 glass-card">
          <CardHeader>
            <CardTitle>Today's Check-In</CardTitle>
            <CardDescription>
              {todayCheckIn
                ? "You’ve already checked in today"
                : "5 emojis, one small moment of reflection"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayCheckIn ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-2">
                    {todayCheckIn.mood_emoji || getMoodEmoji(todayCheckIn.mood)}
                  </div>
                  <p className="text-lg font-medium">
                    {todayCheckIn.emotion_label || "Mood"} ({todayCheckIn.mood}/5)
                  </p>
                  {todayCheckIn.gratitude && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Your reflection:</p>
                      <p>{todayCheckIn.gratitude}</p>
                    </div>
                  )}
                  {todayCheckIn.ai_summary && (
                    <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5 text-left">
                      <p className="text-sm font-medium mb-1">Gemini’s gentle summary</p>
                      <p className="text-sm text-muted-foreground">{todayCheckIn.ai_summary}</p>
                    </div>
                  )}
                  {todayCheckIn.ai_suggestions && (
                    <div className="mt-3 p-4 rounded-lg bg-secondary/10 text-left">
                      <p className="text-sm font-medium mb-1">Supportive suggestions</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {todayCheckIn.ai_suggestions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Choose the emoji that best matches your mood
                  </label>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-3">
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-2xl transition ${
                        mood[0] === 1 ? "bg-background shadow-sm" : "opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => setMood([1])}
                    >
                      😢
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-2xl transition ${
                        mood[0] === 2 ? "bg-background shadow-sm" : "opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => setMood([2])}
                    >
                      😕
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-2xl transition ${
                        mood[0] === 3 ? "bg-background shadow-sm" : "opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => setMood([3])}
                    >
                      😐
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-2xl transition ${
                        mood[0] === 4 ? "bg-background shadow-sm" : "opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => setMood([4])}
                    >
                      🙂
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-2xl transition ${
                        mood[0] === 5 ? "bg-background shadow-sm" : "opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => setMood([5])}
                    >
                      😊
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground text-right">
                    Mood: {mood[0]} / 5
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    What are you grateful for today? (Optional)
                  </label>
                  <Textarea
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    placeholder="I'm grateful for..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Anything else on your mind? (Optional private journal)
                  </label>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="You can write a few more sentences about your day."
                    className="min-h-[100px]"
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {insightsLoading ? "Saving and generating insights..." : "Submit Check-In"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {/* Weekly Summary */}
          <Card className="glass-card md:col-span-1">
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average Mood</span>
                  <span className="text-2xl font-bold">
                    {weeklyStats.count > 0 ? `${weeklyStats.avgMood}/5` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Check-ins</span>
                  <span className="text-2xl font-bold">{weeklyStats.count}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streak Tracker */}
          <Card className="glass-card md:col-span-1">
            <CardHeader>
              <CardTitle>Streak Tracker</CardTitle>
              <CardDescription>Your consistency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current streak</p>
                    <p className="text-3xl font-bold">
                      {streak ? streak.current_streak : 0}{" "}
                      <span className="text-base font-normal text-muted-foreground">days</span>
                    </p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Longest streak</p>
                    <p className="text-xl font-semibold">
                      {streak ? streak.longest_streak : 0}{" "}
                      <span className="text-sm font-normal text-muted-foreground">days</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Small, steady check-ins matter more than perfection.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Check-Ins & Journal */}
          <Card className="glass-card md:col-span-1">
            <CardHeader>
              <CardTitle>Recent Journal Entries</CardTitle>
              <CardDescription>Tap to expand your reflections</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No check-ins yet</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {recentCheckIns.map((checkIn) => (
                    <details
                      key={checkIn.id}
                      className="p-3 bg-muted rounded-lg group border border-transparent hover:border-border transition"
                    >
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <span className="text-xl">
                              {checkIn.mood_emoji || getMoodEmoji(checkIn.mood)}
                            </span>
                            {checkIn.emotion_label || "Mood"} •{" "}
                            {format(new Date(checkIn.created_at), "MMM d, yyyy")}
                          </p>
                          {checkIn.gratitude && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {checkIn.gratitude}
                            </p>
                          )}
                        </div>
                      </summary>
                      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {checkIn.reflection && (
                          <p>
                            <span className="font-medium text-foreground">Journal:</span>{" "}
                            {checkIn.reflection}
                          </p>
                        )}
                        {checkIn.ai_summary && (
                          <p>
                            <span className="font-medium text-foreground">Summary:</span>{" "}
                            {checkIn.ai_summary}
                          </p>
                        )}
                        {checkIn.ai_suggestions && (
                          <p className="whitespace-pre-wrap">
                            <span className="font-medium text-foreground">Suggestions:</span>{" "}
                            {checkIn.ai_suggestions}
                          </p>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
