"use client";

import { useCallback, useState } from "react";
import { toErrorMessage } from "@/lib/errors";
import { readResponseJson } from "@/lib/http/json";

export type RevisionSummary = {
  version: number;
  createdAt: string;
  updatedBy: string | null;
};

function formatRevisionTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
}

export function RevisionHistory<T>({
  endpoint,
  currentVersion,
  versionHeader,
  confirmLabel,
  emptyHint,
  onRestored,
}: {
  endpoint: string;
  currentVersion?: number;
  versionHeader?: string;
  confirmLabel: (revision: RevisionSummary) => string;
  emptyHint: string;
  onRestored: (payload: T, response: Response) => void;
}) {
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await readResponseJson<{
        revisions?: RevisionSummary[];
        error?: string;
      }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load history.");
      }
      setRevisions(data.revisions ?? []);
    } catch (loadError) {
      setError(toErrorMessage(loadError, "Could not load history."));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const restore = async (revision: RevisionSummary) => {
    if (!window.confirm(confirmLabel(revision))) return;
    setRestoring(revision.version);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(versionHeader && currentVersion
            ? { [versionHeader]: String(currentVersion) }
            : {}),
        },
        body: JSON.stringify({ version: revision.version }),
      });
      const data = await readResponseJson<T & { error?: string }>(response);
      if (!response.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data && data.error
            ? String(data.error)
            : "Could not restore that save.",
        );
      }
      onRestored(data, response);
      await load();
    } catch (restoreError) {
      setError(toErrorMessage(restoreError, "Could not restore that save."));
    } finally {
      setRestoring(null);
    }
  };

  return (
    <details className="rounded-2xl border border-brown/10 bg-cream/40 px-4 py-3">
      <summary
        className="cursor-pointer text-sm font-medium text-brown"
        onClick={() => {
          if (revisions.length === 0 && !loading) {
            void load();
          }
        }}
      >
        Restore an earlier save
      </summary>
      <p className="mt-2 text-xs text-muted">
        Restoring writes a new version. The current save stays in history.
      </p>
      {error ? (
        <p className="mt-2 rounded-xl bg-blush/15 px-3 py-2 text-xs text-brown">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="mt-3 text-xs text-muted">Loading history…</p>
      ) : revisions.length === 0 ? (
        <p className="mt-3 text-xs text-muted">{emptyHint}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {revisions.map((revision) => {
            const isCurrent = currentVersion === revision.version;
            return (
              <li
                key={revision.version}
                className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    Version {revision.version}
                    {isCurrent ? " · current" : ""}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {formatRevisionTime(revision.createdAt)}
                    {revision.updatedBy ? ` · ${revision.updatedBy}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isCurrent || restoring !== null}
                  onClick={() => void restore(revision)}
                  className="shrink-0 rounded-full border border-brown/20 px-3 py-1 text-xs font-medium text-brown disabled:opacity-40"
                >
                  {restoring === revision.version ? "Restoring…" : "Restore"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
}
