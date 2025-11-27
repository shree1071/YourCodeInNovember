# Troubleshooting Chatbot Issues

## Common Issues and Solutions

### 1. "Failed to get AI response" Error

This error can have several causes. Check the browser console (F12 → Console tab) for detailed error messages.

#### Issue: API Key Not Set
**Symptoms:** Error message mentions "GEMINI_API_KEY is not configured"

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Add a new secret:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
5. Save and wait a few seconds for it to propagate
6. Try the chat again

#### Issue: Edge Function Not Deployed
**Symptoms:** Error mentions "404" or "not found" or "function not found"

**Solution:**
You need to deploy the Edge Function to Supabase:

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy ai-chat
```

Or deploy via Supabase Dashboard:
1. Go to **Edge Functions** in your Supabase dashboard
2. Click **Deploy new function**
3. Upload or connect your function code

#### Issue: Invalid API Key
**Symptoms:** Error mentions "401", "403", or "unauthorized"

**Solution:**
1. Verify your API key is correct at [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Make sure you copied the entire key (no extra spaces)
3. Regenerate the key if needed
4. Update it in Supabase Secrets

#### Issue: Network/CORS Error
**Symptoms:** Error mentions "CORS" or "network error"

**Solution:**
- Check your internet connection
- Verify Supabase project is active
- Check browser console for CORS errors

### 2. Check Browser Console

**To see detailed errors:**
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to **Console** tab
3. Try sending a message in the chat
4. Look for red error messages
5. Share the error message for more help

### 3. Verify Setup

Run these checks:

1. **API Key is set:**
   - Supabase Dashboard → Settings → Edge Functions → Secrets
   - Should see `GEMINI_API_KEY` in the list

2. **Function is deployed:**
   - Supabase Dashboard → Edge Functions
   - Should see `ai-chat` function listed

3. **Function logs:**
   - Supabase Dashboard → Edge Functions → ai-chat → Logs
   - Check for any error messages

### 4. Test API Key Directly

You can test if your Gemini API key works by making a direct API call:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Hello"}]
    }]
  }'
```

Replace `YOUR_API_KEY` with your actual key. If this works, the issue is with Supabase configuration.

### 5. Still Not Working?

If none of the above helps:
1. Check the browser console for the exact error
2. Check Supabase Edge Function logs
3. Verify your Supabase project is active and not paused
4. Make sure you're using the correct Supabase project

