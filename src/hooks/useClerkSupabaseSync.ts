import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook that automatically syncs Clerk users to Supabase auth
 * Runs when Clerk user signs in
 */
export const useClerkSupabaseSync = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [isSynced, setIsSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  useEffect(() => {
    if (!clerkEnabled || !clerkLoaded || !clerkUser) {
      return;
    }

    const syncToSupabase = async () => {
      // Check if we already have a Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsSynced(true);
        return;
      }

      setIsSyncing(true);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      
      if (!email) {
        console.warn("Clerk user has no email, cannot sync to Supabase");
        setIsSyncing(false);
        return;
      }

      // Generate deterministic password
      const deterministicPassword = `clerk_${clerkUser.id}_sync_2024`;

      try {
        // Try to sign in first (user might already exist)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: deterministicPassword,
        });

        if (signInError && signInError.message.includes("Invalid login credentials")) {
          // User doesn't exist, try to create them
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: deterministicPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                clerk_user_id: clerkUser.id,
                full_name: clerkUser.fullName || clerkUser.firstName || "",
              }
            }
          });

          if (signUpError) {
            // Signup failed - might be email confirmation required or other issue
            console.error("Supabase signup error:", signUpError);
            
            // If it's an email confirmation issue, the user might already exist
            // Try signing in one more time
            const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password: deterministicPassword,
            });
            
            if (retryError || !retrySignIn?.user) {
              // Still failed - might need manual setup
              console.warn("Could not auto-sync Clerk to Supabase. User may need to sign up manually.");
              // Don't set isSynced to true, so user will see error when trying to submit
            } else {
              setIsSynced(true);
            }
          } else if (signUpData?.user) {
            // User created successfully (might need email confirmation)
            // Check if we have a session
            if (signUpData.session) {
              setIsSynced(true);
              console.log("Clerk user synced to Supabase");
            } else {
              // Email confirmation required
              console.log("Supabase user created but email confirmation required");
              // User will need to confirm email, but we'll still try to work
              // The session might be available after confirmation
            }
          }
        } else if (signInData?.user) {
          // Successfully signed in
          setIsSynced(true);
          console.log("Clerk user signed in to Supabase");
        }
      } catch (error) {
        console.error("Error syncing Clerk to Supabase:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncToSupabase();
  }, [clerkEnabled, clerkLoaded, clerkUser, toast]);

  return { isSynced, isSyncing };
};

