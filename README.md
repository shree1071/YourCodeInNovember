# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/59c4d17c-bdc3-43b9-a081-09bfda197841

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/59c4d17c-bdc3-43b9-a081-09bfda197841) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (database, auth, edge functions, cron)
- Gemini (via Lovable AI Gateway) for tone-safe mood insights

## Mood Insights & check-ins

- Daily mood check-ins are stored in the `check_ins` table.
- Each check-in supports:
  - Numeric mood value (1–5 mapped to emojis),
  - Gratitude text,
  - Optional longer reflection,
  - AI-generated weekly-style summary and suggestions (`ai_summary`, `ai_suggestions`).
- Streaks are cached in the `mood_streaks` table and kept up-to-date by a trigger when new check-ins are inserted.
- The dashboard (`Dashboard` page) shows:
  - Emoji Mood Palette (5 emojis instead of a slider),
  - Weekly stats,
  - Streak tracker,
  - Expandable journal entries with AI insights when available.

### Gemini-powered Mood Insights

- The Supabase Edge Function `mood-checkin-ai`:
  - Reads the last ~7 days of check-ins for a user,
  - Calls the Lovable AI Gateway with a Gemini model,
  - Produces a short emotional summary plus gentle, personalized suggestions,
  - Saves them back onto the latest `check_ins` row (`ai_summary`, `ai_suggestions`).
- After a user submits a new check-in from the dashboard, the frontend invokes this function and then refreshes data so insights appear inline.

To enable it, configure the following environment variables in your Supabase project:

- `LOVABLE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Daily reminder emails (Supabase cron)

The project includes a `mood_reminders` table that stores per-user reminder preferences:

- `user_id` – the Supabase auth user id,
- `email` – where to send reminders,
- `reminder_time_utc` – time of day in UTC,
- `timezone` – optional IANA timezone string (e.g. `"America/New_York"`),
- `is_active` – toggle for enabling/disabling reminders.

### 1. Implement a reminder Edge Function

Create a new Supabase function (for example `supabase/functions/mood-reminder/index.ts`) that:

1. Selects all active reminders that should fire “now” (e.g. within the last 5 minutes based on `reminder_time_utc` and `timezone`).
2. Skips any reminder that already has `last_sent_at` set to today.
3. Sends an email via your provider of choice (Resend, SendGrid, etc.).
4. Updates `last_sent_at` for each successfully sent reminder.

### 2. Schedule it with Supabase cron

In the Supabase dashboard:

1. Go to **Edge Functions → Schedules**.
2. Create a new schedule (for example, every 5 minutes) that calls your reminder function.
3. The function logic controls which users actually receive an email at that time.

This setup keeps secrets and email provider keys on the backend while allowing users to manage reminder preferences via the UI.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/59c4d17c-bdc3-43b9-a081-09bfda197841) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
