# OPEC - Mental Health Support Platform

A compassionate mental health support platform with AI-powered chatbot, mood tracking, and community features.

## Features

- 🤖 **AI Support Chat** - Powered by Google Gemini for empathetic conversations
- 📊 **Mood Tracking** - Daily check-ins with AI-powered insights
- 👥 **Community Support** - Connect with others on similar journeys
- 💬 **Messaging** - Private messaging between users
- 📱 **Modern UI** - Soothing, accessible design

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Supabase project and configure environment variables

### API Key Configuration

**Important**: You need to set up your Gemini API key for the chatbot and AI features to work.

See [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) for detailed instructions on:
- How to get a Gemini API key
- Where to put it in Supabase
- Testing the setup

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Google Gemini API
- **Authentication**: Supabase Auth

## Project Structure

```
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── integrations/   # Supabase client
│   └── lib/            # Utilities
├── supabase/
│   ├── functions/      # Edge Functions (AI chat, mood analysis)
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## License

MIT
