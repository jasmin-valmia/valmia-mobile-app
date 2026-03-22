# valmia-mobile-app

Expo scaffold for the separate ValMia mobile app using Clerk for Google sign-in and Supabase for the Events MVP backend.

## Included

- Expo Router-based app shell
- Clerk provider bootstrap
- Supabase client bootstrap
- Environment variable template
- Initial Events feed/auth screen scaffolding
- Supabase migration foundation for the Events schema

## Before running

1. Copy `.env.example` to `.env`.
2. Add the Clerk publishable key.
3. Add the Supabase anon key.
4. Add Google iOS and Android OAuth client IDs once created.
5. Install dependencies with your preferred package manager.
6. Apply the Supabase migrations and seed data.

## Notes

- Do not store the Google client secret in Expo env files.
- The current auth screen is a scaffold placeholder until native Google credentials are added.
- Replace the hand-authored `src/types/database.ts` with generated Supabase types after running the initial migrations.
