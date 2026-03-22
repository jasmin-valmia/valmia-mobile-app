const requiredEnvKeys = [
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
] as const;

type EnvKey = (typeof requiredEnvKeys)[number];

function readEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  clerkPublishableKey: readEnv('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  googleWebClientId: process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID ?? '',
  googleAndroidClientId: process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID ?? '',
  googleIosUrlScheme: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME ?? '',
};
