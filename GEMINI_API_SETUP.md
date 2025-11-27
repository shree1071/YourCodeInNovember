# Gemini API Key Setup Guide

This project uses Google Gemini API for AI features including the chatbot and mood check-in analysis.

## Where to Put Your API Key

### Option 1: Supabase Dashboard (Recommended for Production)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add new secret**
4. Add the following secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API key (see below for how to get one)

### Option 2: Local Development (Supabase CLI)

If you're running Supabase locally, you can set the secret using the Supabase CLI:

```bash
supabase secrets set GEMINI_API_KEY=your_api_key_here
```

## How to Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the generated API key
5. Add it to your Supabase project secrets as described above

## Important Notes

- **Never commit your API key to version control**
- The API key should only be stored in Supabase secrets
- Make sure to set the secret in both your local and production Supabase projects
- The key will be automatically available to all Edge Functions via `Deno.env.get('GEMINI_API_KEY')`

## Testing

After setting up the API key, test the chatbot by:
1. Starting your development server
2. Navigating to the Chat page
3. Sending a test message

If you see an error about `GEMINI_API_KEY is not configured`, make sure you've added the secret in your Supabase project settings.

