import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { StorageError } from "./types";

/** Accept a bare project URL or a mistakenly pasted REST endpoint. */
export function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/rest\/v1$/i, "");
}

export type SupabaseAdminConfig = {
  url: string;
  serviceRoleKey: string;
};

export function readSupabaseAdminConfig(): SupabaseAdminConfig | null {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !serviceRoleKey) return null;
  return {
    url: normalizeSupabaseUrl(rawUrl),
    serviceRoleKey,
  };
}

export function hasSupabaseAdminConfig(): boolean {
  return readSupabaseAdminConfig() !== null;
}

export function createSupabaseAdminClient(
  missingConfigMessage = "Site content storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
): SupabaseClient {
  const config = readSupabaseAdminConfig();
  if (!config) {
    throw new StorageError(missingConfigMessage, 503);
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
