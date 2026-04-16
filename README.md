# Muninn

A collaborative travel itinerary app built with Vue 3, Capacitor, and Supabase. Create trip itineraries, share them with a 6-character code, and alert your group when you're ready to move on.

## Tech Stack

- **Vue 3** + Vite + TypeScript
- **Capacitor 7** — iOS native wrapper
- **Supabase** — database, auth, realtime
- **Pinia** — state management

---

## Prerequisites

- Node.js 18+
- Xcode (Mac App Store)
- CocoaPods (`sudo gem install cocoapods` or `brew install cocoapods`)
- A [Supabase](https://supabase.com) project

---

## Setup

### 1. Clone and install

```sh
git clone https://github.com/fancypams/muninn.git
cd muninn
npm install
```

### 2. Configure environment

```sh
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard under **Project Settings → API**.

### 3. Set up the database

In your Supabase dashboard, go to **SQL Editor** and run the following files in order:

1. `supabase/schema.sql` — creates `trips`, `itinerary_items`, `trip_members` tables and RLS policies
2. `supabase/alerts_schema.sql` — creates `alerts` and `push_tokens` tables for the alert system

### 4. Allow network access on iOS

In `ios/App/App/Info.plist`, the Supabase domain is already added under `NSAppTransportSecurity`. If you use a different Supabase project, update the domain to match your project URL.

### 5. Build and sync

```sh
npm run build
npx cap sync
```

### 6. Open in Xcode

```sh
npx cap open ios
```

In Xcode:
- Select the `App` target
- Go to **Signing & Capabilities** and set your Apple Developer team
- Go to **Build Settings**, search for `User Script Sandboxing`, set it to **No**
- Select a simulator or connected device and hit **Run** (▶)

---

## Development Workflow

After making changes to the Vue app, rebuild and sync before running in Xcode:

```sh
npm run build
npx cap sync
```

For live reload during development, uncomment the `server.url` line in `capacitor.config.ts` with your machine's local IP, then run:

```sh
npm run dev
npx cap run ios
```

---

## Features

- **Auth** — email/password sign up and sign in via Supabase
- **Create Itinerary** — name a trip, add activities with dates and times
- **Join Trip** — enter a 6-character code to join someone else's trip
- **Manage Items** — add, edit, and delete itinerary items
- **Alerts** — when an activity is active (current time is within its window):
  - **Soft alert** — notifies trip members in-app that you're ready to leave whenever
  - **Hard alert** — sends an urgent in-app banner (push notifications require additional APNs setup — see below)

---

## Push Notifications (optional)

Hard alerts send APNs push notifications to all trip members' devices. To enable:

1. In Xcode, select the `App` target → **Signing & Capabilities** → add **Push Notifications**

2. In the [Apple Developer portal](https://developer.apple.com), go to **Certificates, IDs & Profiles → Keys** and create an APNs key. Download the `.p8` file and note the **Key ID** and your **Team ID**.

3. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and deploy the Edge Function:

```sh
supabase functions deploy send-push
supabase secrets set APNS_KEY_ID=your_key_id
supabase secrets set APNS_TEAM_ID=your_team_id
supabase secrets set APNS_PRIVATE_KEY="$(cat AuthKey_XXXXX.p8)"
supabase secrets set APP_BUNDLE_ID=com.muninn.app
supabase secrets set APNS_ENV=sandbox
```

Use `APNS_ENV=production` when submitting to the App Store.

---

## Project Structure

```
muninn/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── pushNotifications.ts # Push token registration
│   ├── stores/
│   │   ├── auth.ts              # Auth state (Pinia)
│   │   ├── trips.ts             # Trip + itinerary CRUD
│   │   └── alerts.ts            # Alert sending + Realtime subscription
│   ├── views/
│   │   ├── LoginView.vue        # Sign in / sign up
│   │   ├── HomeView.vue         # Trip list + create/join actions
│   │   ├── CreateTripView.vue   # New trip form
│   │   ├── TripView.vue         # Trip detail, items, alerts
│   │   └── JoinTripView.vue     # Join by code
│   └── router/index.ts          # Routes with auth guard
├── supabase/
│   ├── schema.sql               # Core tables + RLS
│   ├── alerts_schema.sql        # Alerts + push tokens
│   └── functions/
│       └── send-push/index.ts   # APNs Edge Function
├── capacitor.config.ts
└── .env.example
```
