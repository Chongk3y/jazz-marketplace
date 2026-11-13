/**
 * Supabase is used when both variables are set (in .env.local or the host's
 * environment settings). Otherwise the app runs on local files in `.data/`.
 */
export const supabaseEnv = {
  url: process.env.SUPABASE_URL?.trim() || undefined,
  secretKey: process.env.SUPABASE_SECRET_KEY?.trim() || undefined,
};

export function isSupabaseConfigured() {
  const { url, secretKey } = supabaseEnv;
  if (Boolean(url) !== Boolean(secretKey)) {
    throw new Error(
      "Supabase is half-configured: set both SUPABASE_URL and SUPABASE_SECRET_KEY, or neither."
    );
  }
  return Boolean(url && secretKey);
}
