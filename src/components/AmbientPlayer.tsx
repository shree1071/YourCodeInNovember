import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  X,
} from "lucide-react";

interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  file: string;
}

const ambientSounds: AmbientSound[] = [
  { id: "rain", name: "Rain", icon: "🌧️", file: "/sounds/rain.mp3" },
  { id: "ocean", name: "Ocean", icon: "🌊", file: "/sounds/ocean.mp3" },
  { id: "forest", name: "Forest", icon: "🌲", file: "/sounds/forest.mp3" },
  { id: "cafe", name: "Café", icon: "☕", file: "/sounds/cafe.mp3" },
  { id: "whitenoise", name: "White Noise", icon: "🎧", file: "/sounds/whitenoise.mp3" },
];

export function AmbientPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState([50]);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume[0] / 100;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  // Handle track change
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const sound = ambientSounds.find((s) => s.id === currentTrack);
      if (sound) {
        audioRef.current.src = sound.file;
        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    }
  }, [currentTrack, isPlaying]);

  const handleTrackSelect = (trackId: string) => {
    if (currentTrack === trackId) {
      // Toggle play/pause if same track
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(console.error);
        setIsPlaying(true);
      }
    } else {
      // Switch to new track
      setCurrentTrack(trackId);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack) {
      // If no track selected, select first one
      handleTrackSelect(ambientSounds[0].id);
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    setIsMuted(newVolume[0] === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getCurrentSound = () => {
    return currentTrack ? ambientSounds.find((s) => s.id === currentTrack) : null;
  };

  const currentSound = getCurrentSound();

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg bg-[#1db954] hover:bg-[#1ed760] text-white transition-all hover:scale-105"
          size="icon"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Music className="w-5 h-5" />
          )}
        </Button>
        {isPlaying && currentSound && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-background" />
        )}
      </div>

      {/* Sidebar Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed bottom-6 right-6 z-50 w-72 bg-[#181818] border border-[#282828] rounded-lg shadow-2xl animate-fade-in">
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-[#1db954]" />
                  <h3 className="font-semibold text-white text-sm">Ambient Sounds</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 text-[#b3b3b3] hover:text-white hover:bg-[#282828]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Current Track Info */}
              {currentSound && (
                <div className="flex items-center gap-3 p-3 bg-[#282828] rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{currentSound.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {currentSound.name}
                    </p>
                    <p className="text-xs text-[#b3b3b3]">Ambient Sound</p>
                  </div>
                </div>
              )}

              {/* Track Selection */}
              <div className="space-y-1">
                <p className="text-xs text-[#b3b3b3] mb-2 px-1">Select Sound</p>
                {ambientSounds.map((sound) => {
                  const isActive = currentTrack === sound.id;
                  return (
                    <button
                      key={sound.id}
                      onClick={() => handleTrackSelect(sound.id)}
                      className={`
                        w-full p-3 rounded-lg transition-all duration-200 text-left
                        flex items-center gap-3
                        ${
                          isActive
                            ? "bg-[#1db954] hover:bg-[#1ed760]"
                            : "bg-[#282828] hover:bg-[#333333]"
                        }
                      `}
                    >
                      <span className="text-2xl">{sound.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{sound.name}</p>
                      </div>
                      {isActive && isPlaying && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Controls */}
              <div className="space-y-3 pt-2 border-t border-[#282828]">
                {/* Play/Pause */}
                <div className="flex items-center justify-center">
                  <Button
                    onClick={handlePlayPause}
                    className="rounded-full w-12 h-12 bg-white hover:bg-[#e6e6e6] text-black shadow-lg hover:scale-105 transition-all"
                    size="icon"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 text-[#b3b3b3] hover:text-white hover:bg-[#282828]"
                  >
                    {isMuted || volume[0] === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="flex-1 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&>div]:h-1 [&>div]:bg-[#5e5e5e] [&>div>div]:bg-white"
                  />
                  <span className="text-xs text-[#b3b3b3] w-10 text-right">
                    {volume[0]}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
