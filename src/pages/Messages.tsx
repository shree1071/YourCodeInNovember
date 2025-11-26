import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Send, User } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load session. Please try signing in again.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load connections.",
        variant: "destructive",
      });
    }

    setUsers(data || []);
    setLoadingUsers(false);
  };

  const fetchMessages = async (userId: string) => {
    if (!currentUserId) return;
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    }

    setMessages(data || []);
    setLoadingMessages(false);

    // Mark messages as read
    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("receiver_id", currentUserId)
      .eq("sender_id", userId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
    // Optimistically append message for snappier feel
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        content: newMessage.trim(),
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    // Refresh from server in background
    fetchMessages(selectedUser.id);
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Realtime updates for new messages
  useEffect(() => {
    if (!currentUserId || !selectedUser) return;

    const channel = supabase
      .channel("direct_messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === currentUserId && msg.receiver_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUser]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Messages</h1>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Users List */}
          <Card className="glass-card md:col-span-1">
            <CardHeader>
              <CardTitle>Connections</CardTitle>
            </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground">Loading connections...</p>
                ) : users.filter((u) => u.id !== currentUserId).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No other users yet. Invite someone to join and check back later.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {users
                      .filter((u) => u.id !== currentUserId)
                      .map((user) => (
                        <Button
                          key={user.id}
                          variant={selectedUser?.id === user.id ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedUser(user);
                            fetchMessages(user.id);
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          {user.full_name || "Anonymous"}
                        </Button>
                      ))}
                  </div>
                )}
              </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="glass-card md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedUser ? (selectedUser.full_name || "Anonymous") : "Select a user to chat"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="space-y-4">
                  <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-muted rounded-lg">
                    {loadingMessages ? (
                      <p className="text-sm text-muted-foreground">Loading conversation...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center">
                        No messages yet. Say hi and start the conversation.
                      </p>
                    ) : (
                      <>
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                msg.sender_id === currentUserId
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {format(new Date(msg.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} size="icon" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Select a user from the list to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
