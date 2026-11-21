// ===== Klipu login + reviews setup (Supabase) =====
// Paste the two values from Supabase: Project Settings -> API.
// The anon key is meant to be public, it is safe to keep in this file.
export const SUPABASE_URL = "PASTE_PROJECT_URL";        // like https://abcdxyz.supabase.co
export const SUPABASE_ANON_KEY = "PASTE_ANON_KEY";
// The owner can delete any review. Put your own login email here (also in the SQL policy).
export const OWNER_EMAIL = "";
// true = visitors must log in before using the app (only when Supabase is set up above)
export const REQUIRE_LOGIN = true;
