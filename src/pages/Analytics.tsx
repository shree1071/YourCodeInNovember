import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, startOfWeek, eachDayOfInterval, parseISO } from "date-fns";
import { TrendingUp, Calendar, Heart, MessageSquare, Award } from "lucide-react";

interface CheckIn {
  id: string;
  mood: number;
  emotion_label: string | null;
  mood_emoji: string | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: string;
  sentiment: string | null;
  sentiment_score: number | null;
  created_at: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
}

const COLORS = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444",
  mood: {
    low: "#ef4444",
    medium: "#f59e0b",
    high: "#10b981",
  },
};

const Analytics = () => {
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  useEffect(() => {
    if (clerkEnabled) {
      if (clerkLoaded) {
        if (clerkUser) {
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
    console.log('Fetching analytics data for user:', userId);

    try {
      // Fetch all check-ins
      const { data: checkInsData, error: checkInsError } = await supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (checkInsError) {
        console.error('Error fetching check-ins:', checkInsError);
      } else {
        console.log('Fetched check-ins:', checkInsData?.length || 0);
        setCheckIns(checkInsData || []);
      }

      // Fetch chat messages with sentiment
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("id, role, sentiment, sentiment_score, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error('Error fetching chat messages:', messagesError);
      } else {
        console.log('Fetched chat messages:', messagesData?.length || 0);
        setChatMessages(messagesData || []);
      }

      // Fetch streak
      const { data: streakData, error: streakError } = await supabase
        .from("mood_streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", userId)
        .maybeSingle();

      if (streakError) {
        console.error('Error fetching streak:', streakError);
      } else {
        console.log('Fetched streak data:', streakData);
        if (streakData) {
          setStreak(streakData);
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const getMoodTrendData = () => {
    const last30Days = checkIns.filter((ci) => {
      const date = parseISO(ci.created_at);
      return date >= subDays(new Date(), 30);
    });

    const grouped = last30Days.reduce((acc, ci) => {
      const date = format(parseISO(ci.created_at), "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, mood: 0, count: 0 };
      }
      acc[date].mood += ci.mood;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; mood: number; count: number }>);

    return Object.values(grouped).map((item) => ({
      date: item.date,
      mood: Math.round((item.mood / item.count) * 10) / 10,
    }));
  };

  const getMoodDistribution = () => {
    const distribution = {
      "Low (0-3)": 0,
      "Medium (4-6)": 0,
      "High (7-10)": 0,
    };

    checkIns.forEach((ci) => {
      if (ci.mood <= 3) distribution["Low (0-3)"]++;
      else if (ci.mood <= 6) distribution["Medium (4-6)"]++;
      else distribution["High (7-10)"]++;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const getEmotionDistribution = () => {
    const emotionCounts: Record<string, number> = {};
    checkIns.forEach((ci) => {
      if (ci.emotion_label) {
        emotionCounts[ci.emotion_label] = (emotionCounts[ci.emotion_label] || 0) + 1;
      }
    });

    return Object.entries(emotionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const getSentimentData = () => {
    const sentimentCounts: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    chatMessages.forEach((msg) => {
      if (msg.sentiment) {
        sentimentCounts[msg.sentiment] = (sentimentCounts[msg.sentiment] || 0) + 1;
      }
    });

    return Object.entries(sentimentCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  const getSentimentTrend = () => {
    const last30Days = chatMessages.filter((msg) => {
      const date = parseISO(msg.created_at);
      return date >= subDays(new Date(), 30);
    });

    const grouped = last30Days.reduce((acc, msg) => {
      const date = format(parseISO(msg.created_at), "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, positive: 0, neutral: 0, negative: 0 };
      }
      if (msg.sentiment) {
        acc[date][msg.sentiment]++;
      }
      return acc;
    }, {} as Record<string, { date: string; positive: number; neutral: number; negative: number }>);

    return Object.values(grouped);
  };

  const getWeeklyActivity = () => {
    const last7Weeks = Array.from({ length: 7 }, (_, i) => {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekCheckIns = checkIns.filter((ci) => {
        const date = parseISO(ci.created_at);
        return date >= weekStart && date <= weekEnd;
      });

      return {
        week: format(weekStart, "MMM dd"),
        checkIns: weekCheckIns.length,
      };
    }).reverse();

    return last7Weeks;
  };

  const getActivityHeatmap = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayCheckIns = checkIns.filter((ci) => {
        const ciDate = format(parseISO(ci.created_at), "yyyy-MM-dd");
        return ciDate === dayStr;
      });

      return {
        date: format(day, "MMM dd"),
        count: dayCheckIns.length,
        intensity: dayCheckIns.length > 0 ? Math.min(dayCheckIns.length * 0.3, 1) : 0,
      };
    });
  };

  const getAverageMood = () => {
    if (checkIns.length === 0) return 0;
    const sum = checkIns.reduce((acc, ci) => acc + ci.mood, 0);
    return Math.round((sum / checkIns.length) * 10) / 10;
  };

  const getTotalCheckIns = () => checkIns.length;

  const getTotalChats = () => chatMessages.filter((m) => m.role === "user").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 text-center">Loading analytics...</div>
      </div>
    );
  }

  const moodTrendData = getMoodTrendData();
  const moodDistribution = getMoodDistribution();
  const emotionDistribution = getEmotionDistribution();
  const sentimentData = getSentimentData();
  const sentimentTrend = getSentimentTrend();
  const weeklyActivity = getWeeklyActivity();
  const activityHeatmap = getActivityHeatmap();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-center">Analytics & Insights</h1>
          <p className="text-muted-foreground text-center">
            Visualize your mental health journey with detailed charts and trends
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getAverageMood()}/10</div>
              <p className="text-xs text-muted-foreground">
                Based on {getTotalCheckIns()} check-ins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalCheckIns()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalChats()}</div>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streak?.current_streak || 0} days</div>
              <p className="text-xs text-muted-foreground">
                Best: {streak?.longest_streak || 0} days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="mood" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Mood Charts */}
          <TabsContent value="mood" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mood Trend (Last 30 Days)</CardTitle>
                  <CardDescription>Average mood over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={moodTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>Distribution across mood ranges</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={moodDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {moodDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name.includes("Low")
                                ? COLORS.mood.low
                                : entry.name.includes("Medium")
                                ? COLORS.mood.medium
                                : COLORS.mood.high
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Emotions Charts */}
          <TabsContent value="emotions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription>Most common emotions from check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={emotionDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sentiment Charts */}
          <TabsContent value="sentiment" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Distribution</CardTitle>
                  <CardDescription>Overall sentiment from chat messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || "#8884d8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Trend (Last 30 Days)</CardTitle>
                  <CardDescription>Sentiment over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={sentimentTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="positive"
                        stackId="1"
                        stroke={COLORS.positive}
                        fill={COLORS.positive}
                      />
                      <Area
                        type="monotone"
                        dataKey="neutral"
                        stackId="1"
                        stroke={COLORS.neutral}
                        fill={COLORS.neutral}
                      />
                      <Area
                        type="monotone"
                        dataKey="negative"
                        stackId="1"
                        stroke={COLORS.negative}
                        fill={COLORS.negative}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Charts */}
          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Check-ins per week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="checkIns" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Heatmap (Last 30 Days)</CardTitle>
                  <CardDescription>Daily check-in frequency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {activityHeatmap.map((day, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded flex items-center justify-center text-xs"
                        style={{
                          backgroundColor: day.count > 0
                            ? `rgba(16, 185, 129, ${0.3 + day.intensity * 0.7})`
                            : "#f3f4f6",
                          color: day.count > 0 ? "white" : "#9ca3af",
                        }}
                        title={`${day.date}: ${day.count} check-in${day.count !== 1 ? "s" : ""}`}
                      >
                        {day.count > 0 ? day.count : ""}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded bg-gray-200" />
                      <div className="w-3 h-3 rounded bg-emerald-300" />
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <div className="w-3 h-3 rounded bg-emerald-700" />
                    </div>
                    <span>More</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete Mood Overview</CardTitle>
                <CardDescription>All mood data with trend line</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={moodTrendData}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorMood)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;

