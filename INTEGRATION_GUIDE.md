# Quick Integration Guide

## 1. Run Database Migration

First, run the rewards system migration in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251127000001_rewards_system.sql`
3. Run the SQL script

## 2. Add Rewards to Dashboard

In `src/pages/Dashboard.tsx`, add:

```typescript
import { RewardsDisplay } from "@/components/rewards/RewardsDisplay";
import { BadgesDisplay } from "@/components/rewards/BadgesDisplay";
import { useRewards } from "@/hooks/useRewards";

// Inside Dashboard component:
const { addPoints } = useRewards();

// After successful check-in submission:
const result = await addPoints(10, "Daily check-in completed", "checkin");
if (result?.leveled_up) {
  toast({
    title: "Level Up! 🎉",
    description: `You've reached level ${result.level}!`,
  });
}

// Add to JSX:
<RewardsDisplay />
<BadgesDisplay />
```

## 3. Add Onboarding Check

In `src/App.tsx` or a wrapper component:

```typescript
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useState, useEffect } from "react";

// Check if user has completed onboarding
const [showOnboarding, setShowOnboarding] = useState(false);

useEffect(() => {
  // Check user's onboarding status from database
  // If not completed, set showOnboarding to true
}, []);

{showOnboarding && (
  <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
)}
```

## 4. Award Points for Different Actions

```typescript
// Check-in
await addPoints(10, "Daily check-in", "checkin");

// Streak bonus
await addPoints(5, "3-day streak bonus", "streak");

// Community post
await addPoints(15, "Community contribution", "community");

// AI chat
await addPoints(10, "AI support conversation", "chat");
```

## 5. Update Navigation Spacing

The new navigation includes:
- Better spacing on desktop
- Bottom navigation for mobile
- Improved active states

Make sure to add padding-bottom on mobile pages:
```css
.mobile-padding {
  padding-bottom: 4rem; /* For bottom nav */
}
```

