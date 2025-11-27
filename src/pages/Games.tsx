import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Gamepad2, Sparkles } from "lucide-react";

const Games = () => {
  const [gameLoaded, setGameLoaded] = useState(false);

  useEffect(() => {
    // Try to load the game using the embed script
    const script = document.createElement("script");
    script.src = "https://cdn.htmlgames.com/embed.js?game=BubbleCircle&bgcolor=white";
    script.async = true;
    script.onload = () => setGameLoaded(true);
    
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="htmlgames.com"]');
    if (!existingScript) {
      document.body.appendChild(script);
    } else {
      setGameLoaded(true);
    }
    
    // Clean up
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen gradient-soft">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pt-24">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-4 animate-breathe shadow-glow">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-3">
            Relax & Play
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Take a break and enjoy some fun games to help you unwind and relax
          </p>
        </div>

        <Card className="shadow-soft border-border/50 backdrop-blur-md bg-card/90 rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Bubble Circle</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            A relaxing bubble popping game to help you destress and take your mind off things.
          </p>
          
          <div className="bg-white rounded-2xl p-4 shadow-lg overflow-hidden">
            {/* Primary embed method using iframe */}
            <iframe
              src="https://cdn.htmlgames.com/BubbleCircle/"
              title="Bubble Circle Game"
              className="w-full h-[600px] border-0 rounded-xl"
              allow="fullscreen"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {/* Fallback: Script-based embed */}
          {!gameLoaded && (
            <div className="mt-4 bg-white rounded-2xl p-4 shadow-lg min-h-[600px] flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <div className="animate-bounce mb-4">
                  <Gamepad2 className="w-16 h-16" />
                </div>
                <p className="text-lg">Loading game...</p>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Games are provided for relaxation and entertainment purposes</p>
        </div>
      </div>
    </div>
  );
};

export default Games;

