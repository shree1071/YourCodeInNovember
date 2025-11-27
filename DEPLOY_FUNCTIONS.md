# How to Deploy Supabase Edge Functions

## Method 1: Using Supabase CLI (Recommended)

### Step 1: Install Supabase CLI

If you don't have it installed:

```bash
npm install -g supabase
```

Or using other package managers:
```bash
# Using Homebrew (Mac)
brew install supabase/tap/supabase

# Using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate. After logging in, you'll be authenticated in the CLI.

### Step 3: Link Your Project

You need to link your local project to your Supabase project. Your project ID is: `qibdjoitzmqxyqmcsrbi`

```bash
supabase link --project-ref qibdjoitzmqxyqmcsrbi
```

If you're already in the project directory, it should detect the project automatically.

### Step 4: Deploy the Functions

Deploy both functions:

```bash
# Deploy the AI chat function
supabase functions deploy ai-chat

# Deploy the mood check-in AI function
supabase functions deploy mood-checkin-ai
```

Or deploy both at once:

```bash
supabase functions deploy ai-chat mood-checkin-ai
```

### Step 5: Verify Deployment

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Edge Functions**
3. You should see both `ai-chat` and `mood-checkin-ai` listed

## Method 2: Using Supabase Dashboard (Alternative)

If you prefer using the web interface:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click **Deploy new function** or **Create function**
5. For each function:
   - **Function name**: `ai-chat` (or `mood-checkin-ai`)
   - **Copy the code** from:
     - `supabase/functions/ai-chat/index.ts`
     - `supabase/functions/mood-checkin-ai/index.ts`
   - Paste it into the editor
   - Click **Deploy**

## Troubleshooting

### Error: "Not logged in"
```bash
supabase login
```

### Error: "Project not linked"
```bash
supabase link --project-ref qibdjoitzmqxyqmcsrbi
```

### Error: "Function not found"
Make sure you're in the project root directory and the functions exist in `supabase/functions/`

### Check function logs
After deployment, check logs in the Supabase Dashboard:
- Go to **Edge Functions** → Select function → **Logs**

## Quick Deploy Script

You can also create a simple script. Create a file `deploy.sh` (or `deploy.bat` for Windows):

**deploy.sh (Mac/Linux):**
```bash
#!/bin/bash
supabase functions deploy ai-chat
supabase functions deploy mood-checkin-ai
echo "✅ Functions deployed!"
```

**deploy.bat (Windows):**
```batch
@echo off
supabase functions deploy ai-chat
supabase functions deploy mood-checkin-ai
echo ✅ Functions deployed!
```

Then run:
```bash
# Mac/Linux
chmod +x deploy.sh
./deploy.sh

# Windows
deploy.bat
```

## After Deployment

1. ✅ Functions are deployed
2. ✅ API key is hardcoded in the functions (for prototype)
3. ✅ Test the chatbot by sending a message

The chatbot should now work! 🎉

