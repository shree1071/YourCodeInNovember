import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Heart, TrendingUp, Users, MessageCircle } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16 breathe">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            OPEC
          </h1>
          <p className="text-2xl mb-4 text-foreground font-medium">
            One-Page Emotional Check-ins
          </p>
          <p className="text-xl text-muted-foreground mb-8">
            Simple daily mental health check-ins. Track your mood, practice gratitude,
            and connect with a supportive community.
          </p>
          <div className="flex gap-4 justify-center">
            {clerkEnabled ? (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="lg" className="text-lg">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="lg" variant="outline" className="text-lg">
                      Sign Up
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Button 
                    size="lg" 
                    className="text-lg"
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                </SignedIn>
              </>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="text-lg">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="p-6 glass-card text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Daily Check-ins</h3>
            <p className="text-muted-foreground text-sm">
              Track your mood and practice gratitude every day
            </p>
          </div>

          <div className="p-6 glass-card text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Weekly Insights</h3>
            <p className="text-muted-foreground text-sm">
              Visualize patterns in your emotional wellness journey
            </p>
          </div>

          <div className="p-6 glass-card text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Community</h3>
            <p className="text-muted-foreground text-sm">
              Share and connect with others in a supportive space
            </p>
          </div>

          <div className="p-6 glass-card text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">AI Support</h3>
            <p className="text-muted-foreground text-sm">
              Get compassionate guidance whenever you need it
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
