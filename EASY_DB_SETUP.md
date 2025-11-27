# Easy Database Setup - No CLI Required! 🎉

## Quick Setup in 3 Steps

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Copy & Paste SQL
1. Open the file: `supabase-rewards-setup.sql`
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor

### Step 3: Run It!
1. Click **Run** button (or press Ctrl+Enter)
2. Wait for "Success" message ✅
3. Done! Your rewards system is ready

## What This Sets Up

✅ **User Rewards Table** - Points, levels, XP tracking  
✅ **Badges System** - 10 default badges  
✅ **Points History** - Track all point earnings  
✅ **Daily Challenges** - 5 default challenges  
✅ **Award Points Function** - Automatic level-ups  

## That's It!

No CLI, no terminal, no setup - just SQL Editor! 🚀

## Verify It Worked

Run this in SQL Editor to check:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_rewards', 'badges', 'points_history', 'daily_challenges');

-- Should return 4 rows
```

## Need Help?

If you see any errors:
1. Make sure you're in the correct Supabase project
2. Check that you copied the entire SQL file
3. Look for specific error messages in the SQL Editor output

