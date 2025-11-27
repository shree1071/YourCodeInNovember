// Onboarding flow for new users
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, MessageSquare, Users, Gamepad2, CheckCircle2 } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to OPEC",
    description: "Your personal mental health companion",
    icon: Heart,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          We're here to support you on your wellness journey. Let's get you started!
        </p>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Track your daily mood</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Chat with AI support</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Connect with community</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Earn rewards for consistency</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Daily Check-ins",
    description: "Track your mood and practice gratitude",
    icon: Heart,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center">
          Start each day with a quick check-in. Rate your mood, write what you're grateful for, and reflect on your day.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-medium mb-2">You'll earn:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 10 points for each check-in</li>
            <li>• Bonus points for streaks</li>
            <li>• Badges for milestones</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "AI Support Chat",
    description: "24/7 emotional support",
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center">
          Our AI companion is here to listen, support, and help you navigate your feelings in a safe, judgment-free space.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-medium mb-2">Features:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Confidential conversations</li>
            <li>• Sentiment analysis</li>
            <li>• Crisis support resources</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Community & Games",
    description: "Connect and relax",
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center">
          Join a supportive community and take breaks with relaxing games.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 p-3 rounded-lg">
            <Users className="w-5 h-5 mb-2 text-primary" />
            <p className="text-sm font-medium">Community</p>
            <p className="text-xs text-muted-foreground">Share and support</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <Gamepad2 className="w-5 h-5 mb-2 text-primary" />
            <p className="text-sm font-medium">Games</p>
            <p className="text-xs text-muted-foreground">Relax and unwind</p>
          </div>
        </div>
      </div>
    ),
  },
];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const current = steps[currentStep];
  const Icon = current.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    onComplete();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 shadow-lg">
        <div className="mb-6">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{current.title}</h2>
          <p className="text-muted-foreground">{current.description}</p>
        </div>

        <div className="mb-8 min-h-[200px]">{current.content}</div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1"
            >
              Previous
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1 gradient-primary text-white">
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

