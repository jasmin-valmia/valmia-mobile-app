# Setup checklist

## Auth
- Add Clerk publishable key to `.env`.
- Add Google web/iOS/Android client IDs once they are available.
- Do not place the Google client secret in Expo env files.

## Supabase
- Run the SQL migration in `supabase/migrations/20260322180000_initial_events_schema.sql`.
- Replace the hand-authored `src/types/database.ts` file with generated types once the project is linked to Supabase CLI.
- Apply `supabase/seed.sql` after creating at least one profile row.

## App
- Install dependencies.
- Start Expo with `npm run start`.
- Finish the native Google sign-in flow once the remaining OAuth credentials are ready.
