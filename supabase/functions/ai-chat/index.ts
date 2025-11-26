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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save user message
    await supabase.from('chat_messages').insert({
      user_id: userId,
      role: 'user',
      content: message,
    });

    // Get recent conversation history for context
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const conversationHistory = recentMessages?.reverse() || [];
    
    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a compassionate mental health support AI assistant. Your role is to:
- Listen actively and empathetically to users' concerns
- Provide emotional validation and support
- Suggest healthy coping strategies when appropriate
- Detect the emotional tone of conversations
- NEVER provide medical diagnosis or replace professional help
- If someone is in crisis, gently encourage them to reach out to crisis helplines

After each response, analyze the user's message sentiment and include it in your thinking.`
          },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

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