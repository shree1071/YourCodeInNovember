import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Gamepad2, Sparkles, Circle, Coffee, Grid3x3, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Game {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const games: Game[] = [
  {
    id: "bubble-circle",
    name: "Bubble Circle",
    description: "A relaxing bubble popping game to help you destress and take your mind off things.",
    url: "https://cdn.htmlgames.com/BubbleCircle/",
    icon: Circle,
  },
  {
    id: "coffee-mahjong",
    name: "Coffee Mahjong",
    description: "A soothing mahjong solitaire game with a warm coffee theme. Match tiles and relax.",
    url: "https://cdn.htmlgames.com/CoffeeMahjong/",
    icon: Coffee,
  },
  {
    id: "cup-of-tea-mahjong",
    name: "Cup of Tea Mahjong",
    description: "A soothing mahjong solitaire game with a calming tea theme. Match tiles and relax.",
    url: "https://cdn.htmlgames.com/CupOfTeaMahjong/",
    icon: Coffee,
  },
  {
    id: "connect-the-bubbles",
    name: "Connect The Bubbles",
    description: "A relaxing puzzle game where you connect matching bubbles. Perfect for stress relief.",
    url: "https://cdn.htmlgames.com/ConnectTheBubbles/",
    icon: Circle,
  },
  {
    id: "plushy-animals",
    name: "Plushy Animals",
    description: "A cute and relaxing game with adorable plushy animals. Perfect for unwinding and feeling calm.",
    url: "https://cdn.htmlgames.com/PlushyAnimals/",
    icon: Heart,
  },
];

const Games = () => {
  const [selectedGame, setSelectedGame] = useState(games[0].id);
  const selectedGameData = games.find((g) => g.id === selectedGame) || games[0];

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
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Select a Game</h2>
          </div>

          {/* Game Grid Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {games.map((game) => {
              const Icon = game.icon;
              const isSelected = selectedGame === game.id;
              const isAvailable = !!game.url;
              
              return (
                <Button
                  key={game.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`flex flex-col items-center gap-2 h-auto py-4 px-3 ${
                    isSelected ? "gradient-primary text-white" : ""
                  } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => isAvailable && setSelectedGame(game.id)}
                  disabled={!isAvailable}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs text-center leading-tight">{game.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Game Display */}
          <div className="mt-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">{selectedGameData.name}</h3>
              <p className="text-muted-foreground">{selectedGameData.description}</p>
            </div>
            
            {selectedGameData.url ? (
              <div className="bg-white rounded-2xl p-4 shadow-lg overflow-hidden">
                <iframe
                  key={selectedGame}
                  src={selectedGameData.url}
                  title={selectedGameData.name}
                  className="w-full h-[600px] border-0 rounded-xl"
                  allow="fullscreen"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-lg min-h-[600px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Grid3x3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">This game is coming soon!</p>
                  <p className="text-sm mt-2">Check back later for more relaxing games.</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Games are provided for relaxation and entertainment purposes</p>
        </div>
      </div>
    </div>
  );
};

export default Games;
