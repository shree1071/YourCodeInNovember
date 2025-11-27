import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  SignUpButton, 
  UserButton 
} from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { Home, MessageSquare, Users, User, Heart, Gamepad2 } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user: clerkUser } = useUser();
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  const handleLogout = async () => {
    if (clerkEnabled && clerkUser) {
      // Clerk handles logout through UserButton, but we can navigate
      navigate("/");
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    } else {
      // Supabase logout
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    }
  };

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/chat", icon: Heart, label: "AI Support" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/community", icon: Users, label: "Community" },
    { path: "/games", icon: Gamepad2, label: "Games" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          OPEC
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {clerkEnabled ? (
            <>
              <SignedOut>
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm">
                      Sign Up
                    </Button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              </SignedIn>
            </>
          ) : (
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          )}
        </div>

        <div className="md:hidden flex items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
          
          {clerkEnabled && (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              </SignedIn>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
