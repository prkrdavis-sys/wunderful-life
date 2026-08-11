import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { StorageError } from "./types";
import type { SiteContent } from "@/lib/site/types";
import type { PortfolioVideo } from "@/lib/videos/types";

type SiteContentRow = {
  id: string;
  content: SiteContent;
  version: number;
  updated_at: string;
  updated_by: string | null;
};

type PortfolioLibraryRow = {
  id: string;
  videos: PortfolioVideo[];
  version: number;
  updated_at: string;
  updated_by: string | null;
};

function readEnv(name: string): string | undefined {
  return process.env[name];
}

/** Accept a bare project URL or a mistakenly pasted REST endpoint. */
function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/rest\/v1$/i, "");
}

export function hasSiteDatabaseConfig(): boolean {
  return Boolean(
    readEnv("SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

function getSiteDatabase(): SupabaseClient {
  const rawUrl = readEnv("SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!rawUrl || !serviceRoleKey) {
    throw new StorageError(
      "Site content storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      503,
    );
  }

  return createClient(normalizeSupabaseUrl(rawUrl), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function unwrapRow(data: SiteContentRow | SiteContentRow[] | null): SiteContentRow {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new StorageError("Site content storage returned no record.", 503);
  }
  return row;
}

function storageError(error: unknown, fallback: string): StorageError {
  if (error instanceof StorageError) return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    (error as { message?: unknown }).message === "SITE_CONTENT_VERSION_CONFLICT"
  ) {
    return new StorageError(
      "This editor is out of date. The latest site content was saved elsewhere.",
      409,
    );
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    (error as { message?: unknown }).message ===
      "PORTFOLIO_LIBRARY_VERSION_CONFLICT"
  ) {
    return new StorageError(
      "The video library changed while this save was in progress. Reload and try again.",
      409,
    );
  }
  return new StorageError(
    error instanceof Error && error.message ? error.message : fallback,
    503,
  );
}

export type StoredSiteContent = {
  content: SiteContent;
  version: number;
  updatedAt: string;
};

export type StoredPortfolioLibrary = {
  videos: PortfolioVideo[];
  version: number;
  updatedAt: string;
};

function toStoredContent(row: SiteContentRow): StoredSiteContent {
  return {
    content: row.content,
    version: row.version,
    updatedAt: row.updated_at,
  };
}

export async function readStoredSiteContent(): Promise<StoredSiteContent | null> {
  try {
    const { data, error } = await getSiteDatabase()
      .from("site_content")
      .select("id, content, version, updated_at, updated_by")
      .eq("id", "singleton")
      .maybeSingle();

    if (error) throw error;
    return data ? toStoredContent(data as SiteContentRow) : null;
  } catch (error) {
    throw storageError(error, "Could not load site content.");
  }
}

export async function initializeStoredSiteContent(
  content: SiteContent,
): Promise<StoredSiteContent> {
  try {
    const { data, error } = await getSiteDatabase().rpc(
      "initialize_site_content",
      { initial_content: content, actor: "migration" },
    );

    if (error) throw error;
    return toStoredContent(unwrapRow(data as SiteContentRow));
  } catch (error) {
    throw storageError(error, "Could not initialize site content storage.");
  }
}

export async function saveStoredSiteContent(
  content: SiteContent,
  expectedVersion: number,
  actor = "admin",
): Promise<StoredSiteContent> {
  try {
    const { data, error } = await getSiteDatabase().rpc("save_site_content", {
      expected_version: expectedVersion,
      next_content: content,
      actor,
    });

    if (error) throw error;
    return toStoredContent(unwrapRow(data as SiteContentRow));
  } catch (error) {
    throw storageError(error, "Could not save site content.");
  }
}

function toStoredPortfolioLibrary(
  row: PortfolioLibraryRow,
): StoredPortfolioLibrary {
  return {
    videos: row.videos,
    version: row.version,
    updatedAt: row.updated_at,
  };
}

export async function readStoredPortfolioLibrary(): Promise<StoredPortfolioLibrary | null> {
  try {
    const { data, error } = await getSiteDatabase()
      .from("portfolio_library")
      .select("id, videos, version, updated_at, updated_by")
      .eq("id", "singleton")
      .maybeSingle();

    if (error) throw error;
    return data
      ? toStoredPortfolioLibrary(data as PortfolioLibraryRow)
      : null;
  } catch (error) {
    throw storageError(error, "Could not load the video library.");
  }
}

export async function initializeStoredPortfolioLibrary(
  videos: PortfolioVideo[],
): Promise<StoredPortfolioLibrary> {
  try {
    const { data, error } = await getSiteDatabase().rpc(
      "initialize_portfolio_library",
      { initial_videos: videos, actor: "migration" },
    );

    if (error) throw error;
    return toStoredPortfolioLibrary(
      unwrapPortfolioRow(data as PortfolioLibraryRow | PortfolioLibraryRow[] | null),
    );
  } catch (error) {
    throw storageError(error, "Could not initialize the video library.");
  }
}

export async function saveStoredPortfolioLibrary(
  videos: PortfolioVideo[],
  expectedVersion: number,
): Promise<StoredPortfolioLibrary> {
  try {
    const { data, error } = await getSiteDatabase().rpc(
      "save_portfolio_library",
      {
        expected_version: expectedVersion,
        next_videos: videos,
        actor: "admin",
      },
    );

    if (error) throw error;
    return toStoredPortfolioLibrary(
      unwrapPortfolioRow(data as PortfolioLibraryRow | PortfolioLibraryRow[] | null),
    );
  } catch (error) {
    throw storageError(error, "Could not save the video library.");
  }
}

function unwrapPortfolioRow(
  data: PortfolioLibraryRow | PortfolioLibraryRow[] | null,
): PortfolioLibraryRow {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new StorageError("Video library storage returned no record.", 503);
  }
  return row;
}
