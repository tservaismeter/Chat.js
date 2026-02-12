/**
 * Supabase client for database access
 */

import { createClient } from "@supabase/supabase-js";
import { appConfig } from "../config.js";
import { diagnostics } from "../diagnostics.js";

export const supabase = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);

/**
 * Lightweight startup check to validate Supabase connectivity and permissions.
 */
export async function verifySupabaseConnectivity(): Promise<void> {
  const { error } = await supabase
    .from("utilities")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (error) {
    diagnostics.markDependencyDown("supabase", error, "Supabase startup check failed");
    throw new Error(`Supabase connectivity check failed: ${error.message}`);
  }

  diagnostics.markDependencyOk("supabase", "Supabase connectivity check passed");
}
