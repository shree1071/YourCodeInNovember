import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Heart, Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
      navigate("/chat");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/chat");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setOauthLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/chat`,
        },
      });

      if (error) throw error;
      // Supabase will redirect; no further action needed here
    } catch (error: any) {
      toast({
        title: "Google sign-in failed",
        description: error.message || "Please try again or use email instead.",
        variant: "destructive",
      });
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="animate-breathe mb-4 mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Wellness Wings
          </h1>
          <p className="text-muted-foreground mt-2">Your journey to better mental health</p>
        </div>

        <Card className="shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader>
              <TabsList className={`w-full ${clerkEnabled ? "grid grid-cols-3" : "grid grid-cols-2"}`}>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                {clerkEnabled && <TabsTrigger value="clerk">Clerk</TabsTrigger>}
              </TabsList>
            </CardHeader>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to continue your wellness journey
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full gradient-primary text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="relative w-full text-center">
                    <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      or
                    </span>
                    <div className="border-t border-border mt-3" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={oauthLoading}
                  >
                    {oauthLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting to Google...
                      </>
                    ) : (
                      "Continue with Google"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Start your journey to better mental well-being
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full gradient-primary text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {clerkEnabled && (
              <TabsContent value="clerk">
                <CardContent className="space-y-4">
                  <CardTitle>Continue with Clerk</CardTitle>
                  <CardDescription>
                    Use Clerk-hosted authentication for sign in and sign up.
                  </CardDescription>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-3 bg-muted/40">
                      <SignIn
                        routing="hash"
                        signUpUrl="#/auth?mode=signup"
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "shadow-none border-0 bg-transparent p-0",
                          },
                        }}
                      />
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/40">
                      <SignUp
                        routing="hash"
                        signInUrl="#/auth"
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "shadow-none border-0 bg-transparent p-0",
                          },
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;