import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://whhshqlrdhscljbwhubz.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_GchQKs02TYvp_s1pkYKYuQ__PdaUtQF";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
