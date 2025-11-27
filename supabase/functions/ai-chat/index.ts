import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    // Prototype: Using API key directly (NOT for production!)
    const GEMINI_API_KEY = 'AIzaSyDQVe_vAKwleUu_Zfno58di2DGGYLLJr-I';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save user message
    await supabase.from('chat_messages').insert({
      user_id: userId,
      role: 'user',
      content: message,
    });

    // Get recent conversation history for context (excluding the message we just saved)
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12); // Get a few extra to account for the current message

    // Filter out the current message if it's already in the history, and reverse to chronological order
    const conversationHistory = (recentMessages || [])
      .filter(msg => msg.content !== message) // Exclude current message if it's already saved
      .reverse()
      .slice(-10); // Keep last 10 messages for context
    
    // Build conversation context for Gemini
    // Gemini doesn't have a system role, so we'll include instructions in the first user message
    const systemInstruction = `You are a compassionate mental health support AI assistant. Your role is to:
- Listen actively and empathetically to users' concerns
- Provide emotional validation and support
- Suggest healthy coping strategies when appropriate
- Detect the emotional tone of conversations
- NEVER provide medical diagnosis or replace professional help
- If someone is in crisis, gently encourage them to reach out to crisis helplines

Keep responses warm, understanding, and supportive. Be concise but caring.`;

    // Convert conversation history to Gemini format
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    
    // If this is the first message, add system instruction context
    if (conversationHistory.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nUser: ${message}` }]
      });
    } else {
      // Add system instruction as context in the first exchange
      contents.push({
        role: 'user',
        parts: [{ text: systemInstruction }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'I understand. I\'m here to listen and provide support. How can I help you today?' }]
      });

      // Add conversation history (alternating user/model)
      for (const msg of conversationHistory) {
        if (msg.role === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: msg.content }]
          });
        } else if (msg.role === 'assistant') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.content }]
          });
        }
      }

      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }
    
    // Call Google Gemini API directly
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errorText);
      throw new Error(`Gemini API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an error processing your message. Please try again.';

    // Simple sentiment analysis based on keywords
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

    const sentimentAnalysis = analyzeSentiment(message);

    // Save assistant response with sentiment
    await supabase.from('chat_messages').insert({
      user_id: userId,
      role: 'assistant',
      content: assistantMessage,
      sentiment: sentimentAnalysis.sentiment,
      sentiment_score: sentimentAnalysis.score,
    });

    // Check if user needs crisis support
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'no reason to live'];
    const needsCrisisSupport = crisisKeywords.some(keyword => message.toLowerCase().includes(keyword));

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        sentiment: sentimentAnalysis.sentiment,
        needsCrisisSupport
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});