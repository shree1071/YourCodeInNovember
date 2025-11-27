import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, checkInId } = await req.json();

    if (!userId || !checkInId) {
      throw new Error("userId and checkInId are required");
    }

    // Prototype: Using API key directly (NOT for production!)
    const GEMINI_API_KEY = 'AIzaSyDQVe_vAKwleUu_Zfno58di2DGGYLLJr-I';
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load the latest check-in that triggered this request
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .select("id, mood, mood_emoji, emotion_label, gratitude, reflection, created_at")
      .eq("id", checkInId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkInError) {
      throw checkInError;
    }

    if (!checkIn) {
      throw new Error("Check-in not found for this user");
    }

    // Load last 7 days of check-ins for context
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentCheckIns } = await supabase
      .from("check_ins")
      .select("mood, mood_emoji, emotion_label, gratitude, reflection, created_at")
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: true })
      .limit(30);

    const historySummary = (recentCheckIns || [])
      .map((c) => {
        const date = new Date(c.created_at as string).toISOString().split("T")[0];
        const emoji = c.mood_emoji || "";
        const label = c.emotion_label || "";
        const gratitude = c.gratitude ? `Gratitude: ${c.gratitude}` : "";
        const reflection = c.reflection ? `Reflection: ${c.reflection}` : "";
        return `- ${date} | Mood: ${c.mood}/5 ${emoji} ${label}\n  ${gratitude}\n  ${reflection}`;
      })
      .join("\n");

    const prompt = `You are a compassionate mental health companion helping a user reflect on their week.

Here is their recent mood check-in history (most recent at the bottom):
${historySummary || "No previous check-ins, just today's entry."}

Please respond in STRICT JSON with the following shape:
{
  "short_summary": "1–3 sentence emotional summary of the recent week, gentle and validating.",
  "personalized_suggestions": "3 short bullet-style suggestions for the next few days, tone-safe and non-clinical.",
  "tone_label": "one of: 'uplifting', 'steady', 'tender', 'fragile'"
}

Do not include any extra keys, markdown, or commentary. Keep language simple, supportive, and non-diagnostic.`;

    // Call Google Gemini API directly
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a supportive, non-judgmental emotional wellbeing assistant. You never diagnose or mention disorders. You keep things short, gentle, and practical.\n\n${prompt}`
              }
            ]
          }
        ],
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
      console.error("Gemini API error:", aiResponse.status, errorText);
      throw new Error(`Gemini API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (_e) {
      console.warn("Failed to parse AI JSON, falling back to defaults");
      parsed = {
        short_summary: "This week had a mix of moments. It’s okay to be exactly where you are.",
        personalized_suggestions:
          "• Take one small moment each day to notice something that feels okay or good.\n• Reach out to someone you trust, even with a short message.\n• Be gentle with your expectations; small steps still count.",
        tone_label: "steady",
      };
    }

    const aiSummary = String(parsed.short_summary || "").slice(0, 600);
    const aiSuggestions = String(parsed.personalized_suggestions || "").slice(0, 1200);

    // Save insights onto the latest check-in
    const { error: updateError } = await supabase
      .from("check_ins")
      .update({
        ai_summary: aiSummary,
        ai_suggestions: aiSuggestions,
      })
      .eq("id", checkInId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Failed to update check-in with AI insights", updateError);
    }

    return new Response(
      JSON.stringify({
        summary: aiSummary,
        suggestions: aiSuggestions,
        tone_label: parsed.tone_label || "steady",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in mood-checkin-ai function:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


