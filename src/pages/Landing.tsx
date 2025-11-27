import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Heart, TrendingUp, Users, MessageCircle, Gamepad2, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { OPECLogo } from "@/components/OPECLogo";

const Landing = () => {
  const navigate = useNavigate();
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  const features = [
    {
      icon: Heart,
      title: "Daily Check-ins",
      description: "Track your mood and practice gratitude every day",
      color: "text-red-500",
    },
    {
      icon: MessageCircle,
      title: "AI Support",
      description: "Get compassionate guidance whenever you need it",
      color: "text-blue-500",
    },
    {
      icon: Users,
      title: "Community",
      description: "Share and connect with others in a supportive space",
      color: "text-green-500",
    },
    {
      icon: Gamepad2,
      title: "Relaxing Games",
      description: "Take breaks with calming games to unwind",
      color: "text-purple-500",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Visualize patterns in your emotional wellness journey",
      color: "text-orange-500",
    },
    {
      icon: Sparkles,
      title: "Earn Rewards",
      description: "Gamified system to motivate consistency",
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="min-h-screen gradient-soft">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <OPECLogo size="xl" className="animate-breathe" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl -z-10"></div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            OPEC
          </h1>
          <p className="text-2xl md:text-3xl mb-4 text-foreground font-semibold">
            One-Page Emotional Check-ins
          </p>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your personal mental health companion. Track your mood, practice gratitude, 
            connect with community, and earn rewards for consistency.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {clerkEnabled ? (
              <>
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg" className="text-lg px-8 gradient-primary text-white shadow-lg hover:shadow-xl transition-all">
                      Get Started Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button size="lg" variant="outline" className="text-lg px-8">
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Button 
                    size="lg" 
                    className="text-lg px-8 gradient-primary text-white shadow-lg"
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </SignedIn>
              </>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 gradient-primary text-white shadow-lg hover:shadow-xl transition-all">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>

          {/* Key Benefits */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-12">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Private & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>AI-Powered Support</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50 group"
              >
                <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  1
                </div>
                <h3 className="font-semibold mb-2">Sign Up</h3>
                <p className="text-sm text-muted-foreground">
                  Create your free account in seconds
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  2
                </div>
                <h3 className="font-semibold mb-2">Check In Daily</h3>
                <p className="text-sm text-muted-foreground">
                  Track your mood and practice gratitude
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  3
                </div>
                <h3 className="font-semibold mb-2">Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Level up and unlock badges for consistency
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;
