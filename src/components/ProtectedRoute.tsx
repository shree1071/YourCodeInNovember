import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isLoaded: clerkLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  useEffect(() => {
    if (clerkEnabled) {
      // Clerk handles auth through SignedIn/SignedOut components
      if (clerkLoaded) {
        setLoading(false);
      }
      return;
    }

    // Check Supabase auth
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate("/auth");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, clerkEnabled, clerkLoaded]);

  if (clerkEnabled) {
    if (!clerkLoaded) {
      return (
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    
    return (
      <>
        <SignedIn>{children}</SignedIn>
        <SignedOut>
          <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Please sign in to continue</p>
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </SignedOut>
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to /auth
  }

  return <>{children}</>;
};

export default ProtectedRoute;

