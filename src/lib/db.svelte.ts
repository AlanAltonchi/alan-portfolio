import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "$lib/types";

export let supabase: SupabaseClient<Database>;

export const init = (sb: SupabaseClient<Database>) => {
    supabase = sb;
}