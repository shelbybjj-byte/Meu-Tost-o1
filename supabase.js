import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bhbboegwmnqejkixbvqb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_...";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);