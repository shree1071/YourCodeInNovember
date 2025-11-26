import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Mail, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setEmail(session.user.email || "");
    }
  };

  return (
    <div className="min-h-screen gradient-soft">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Account Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">{email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
                <CardTitle>Privacy & Safety</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Your data is encrypted and secure. We never share your personal information.
              </CardDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Anonymous community posts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Private chat history</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Secure authentication</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              If you're in crisis or need immediate support, please reach out to these resources:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>National Suicide Prevention Lifeline:</strong> 988
            </p>
            <p className="text-sm">
              <strong>Crisis Text Line:</strong> Text HOME to 741741
            </p>
            <p className="text-sm">
              <strong>SAMHSA National Helpline:</strong> 1-800-662-4357
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;