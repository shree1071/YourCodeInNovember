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
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API Key (from Edge Function - prototype only, not for production!)
const GEMINI_API_KEY = 'AIzaSyDQVe_vAKwleUu_Zfno58di2DGGYLLJr-I';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
    // Load chat history from localStorage if available
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })));
      } catch (e) {
        console.error('Error loading saved messages:', e);
      }
    }
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

  // Analyze sentiment from text
  const analyzeSentiment = (text: string): { sentiment: string; score: number } => {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['happy', 'joy', 'grateful', 'excited', 'love', 'wonderful', 'great', 'good', 'better', 'glad', 'thankful', 'hopeful'];
    const negativeWords = ['sad', 'depressed', 'anxious', 'worried', 'scared', 'lonely', 'hurt', 'pain', 'crying', 'hopeless', 'afraid', 'angry', 'terrible', 'awful'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    const totalWords = positiveCount + negativeCount;
    
    if (totalWords === 0) {
      return { sentiment: 'neutral', score: 0.5 };
    }
    
    const positiveRatio = positiveCount / totalWords;
    
    if (positiveRatio > 0.6) {
      return { sentiment: 'positive', score: Math.min(0.99, 0.6 + (positiveRatio * 0.3)) };
    } else if (positiveRatio < 0.4) {
      return { sentiment: 'negative', score: Math.max(-0.99, -0.6 - ((1 - positiveRatio) * 0.3)) };
    } else {
      return { sentiment: 'neutral', score: 0.5 };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !userId) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Save to localStorage
    localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));

    try {
      // Use Google AI SDK to call Gemini API (handles CORS properly)
      const systemInstruction = `You are a compassionate mental health support AI assistant. Your role is to:
- Listen actively and empathetically to users' concerns
- Provide emotional validation and support
- Suggest healthy coping strategies when appropriate
- Detect the emotional tone of conversations
- NEVER provide medical diagnosis or replace professional help
- If someone is in crisis, gently encourage them to reach out to crisis helplines

Keep responses warm, understanding, and supportive. Be concise but caring.`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        systemInstruction: systemInstruction,
      });
      
      // Convert conversation history to the format expected by the SDK
      const chat = model.startChat({
        history: messages.slice(-10).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Send the current message
      const result = await chat.sendMessage(input);
      const response = await result.response;
      const assistantMessage = response.text();

      // Analyze sentiment
      const sentimentAnalysis = analyzeSentiment(input);

      // Check for crisis keywords
      const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'no reason to live'];
      const needsCrisisSupport = crisisKeywords.some(keyword => input.toLowerCase().includes(keyword));
      
      if (needsCrisisSupport) {
        setShowCrisisAlert(true);
      }

      const aiMessage: Message = {
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date(),
        sentiment: sentimentAnalysis.sentiment,
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Save to localStorage
      localStorage.setItem('chat_messages', JSON.stringify(finalMessages));

      // Optionally save to Supabase for persistence (non-blocking)
      if (userId) {
        supabase.from('chat_messages').insert([
          {
            user_id: userId,
            role: 'user',
            content: input,
            sentiment: sentimentAnalysis.sentiment,
            sentiment_score: sentimentAnalysis.score,
          },
          {
            user_id: userId,
            role: 'assistant',
            content: assistantMessage,
            sentiment: sentimentAnalysis.sentiment,
          }
        ]).catch(err => {
          console.error('Error saving to Supabase (non-critical):', err);
        });
      }
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error?.message || 'Failed to get AI response. Please try again.';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-soft">
      <Navigation />
      
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-4 animate-breathe shadow-glow">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-3">
            AI Support Chat
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Share your thoughts in a safe, judgment-free space. I'm here to listen and support you.
          </p>
        </div>

        {showCrisisAlert && (
          <Alert variant="destructive" className="mb-6 animate-fade-in border-2 shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-base">
              <strong className="text-lg block mb-2">If you're in crisis, please reach out immediately:</strong>
              <div className="space-y-1.5">
                <div>• National Suicide Prevention Lifeline: <strong className="text-lg">988</strong></div>
                <div>• Crisis Text Line: Text <strong className="text-lg">HOME to 741741</strong></div>
                <div>• SAMHSA National Helpline: <strong className="text-lg">1-800-662-4357</strong></div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-soft border-border/50 backdrop-blur-md bg-card/90 mb-6 min-h-[550px] max-h-[650px] overflow-y-auto p-6 rounded-3xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-center px-4">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center animate-breathe shadow-glow">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-card animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Start a conversation</h3>
              <p className="text-muted-foreground max-w-md text-base leading-relaxed">
                I'm here to listen and provide emotional support. Share what's on your mind, and I'll be here with you every step of the way.
              </p>
              <div className="mt-8 flex flex-wrap gap-2 justify-center">
                <span className="px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">✨ Non-judgmental</span>
                <span className="px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">💙 Confidential</span>
                <span className="px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">🌱 Supportive</span>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 animate-fade-in ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-soft flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-5 rounded-3xl transition-smooth ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-br from-muted to-muted/80 shadow-md hover:shadow-lg"
                    }`}
                  >
                    <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/20">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {message.sentiment && (
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          message.sentiment === 'positive' ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          message.sentiment === 'negative' ? 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' :
                          'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {message.sentiment}
                        </span>
                      )}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-soft flex-shrink-0 mt-1">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 justify-start animate-fade-in">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-soft">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gradient-to-br from-muted to-muted/80 p-5 rounded-3xl shadow-md">
                    <div className="flex gap-2 items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "200ms" }} />
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "400ms" }} />
                      <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card>

        <div className="flex gap-3 items-end sticky bottom-4 bg-card/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-border/50">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Share what's on your mind..."
            className="flex-1 text-base py-6 rounded-xl border-2 focus:border-primary/50 transition-all"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            className="gradient-primary text-white px-6 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !input.trim()}
            size="lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;