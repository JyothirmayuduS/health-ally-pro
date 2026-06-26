import "dotenv/config";

/** @type {import('expo/config').ExpoConfig} */
export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    medoraApiUrl: process.env.EXPO_PUBLIC_MEDORA_API_URL,
    medoraAiKey: process.env.EXPO_PUBLIC_MEDORA_AI_KEY,
  },
});
