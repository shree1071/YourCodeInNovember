import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Bot, User as UserIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sentiment?: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUserId(session.user.id);
    }
  };

  const loadChatHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error loading chat history:', error);
      return;
    }

    if (data) {
      const loadedMessages: Message[] = data.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        sentiment: msg.sentiment,
      }));
      setMessages(loadedMessages);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !userId) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: input, userId }
      });

      if (error) throw error;

      if (data.needsCrisisSupport) {
        setShowCrisisAlert(true);
      }

      const aiMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        sentiment: data.sentiment,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error calling AI chat:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-soft">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Support Chat
          </h1>
          <p className="text-muted-foreground mt-2">
            Share your thoughts in a safe, judgment-free space
          </p>
        </div>

        {showCrisisAlert && (
          <Alert variant="destructive" className="mb-4 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you're in crisis, please reach out immediately:
              <br />
              • National Suicide Prevention Lifeline: <strong>988</strong>
              <br />
              • Crisis Text Line: Text <strong>HOME to 741741</strong>
              <br />
              • SAMHSA National Helpline: <strong>1-800-662-4357</strong>
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-soft border-border/50 backdrop-blur-sm bg-card/80 mb-4 min-h-[500px] max-h-[600px] overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[460px] text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4 animate-breathe shadow-glow">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground max-w-md">
                I'm here to listen and provide emotional support. Share what's on your mind.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-fade-in ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-soft flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl transition-smooth ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.sentiment && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          message.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                          message.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {message.sentiment}
                        </span>
                      )}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-soft flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-soft">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted p-4 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            className="gradient-primary text-white"
            disabled={loading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;