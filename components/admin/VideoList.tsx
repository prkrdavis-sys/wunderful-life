"use client";

import { useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { formatDuration, platformLabel } from "@/lib/videos/types";
import { VideoThumbnail } from "@/components/ui/VideoThumbnail";

type VideoListProps = {
  videos: PortfolioVideo[];
  onEdit: (video: PortfolioVideo) => void;
  onChange: (videos: PortfolioVideo[]) => void;
};

function PlatformChip({ platform }: { platform: PortfolioVideo["platform"] }) {
  return (
    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-indigo uppercase backdrop-blur-sm">
      {platformLabel(platform)}
    </span>
  );
}

export function VideoList({ videos, onEdit, onChange }: VideoListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featuredCount = videos.filter((video) => video.featured).length;

  const reorder = async (previous: PortfolioVideo[], ordered: PortfolioVideo[]) => {
    onChange(ordered);
    try {
      const response = await fetch("/api/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: ordered.map((video) => video.id) }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Reorder failed.");
      }
      const saved = (await response.json()) as PortfolioVideo[];
      onChange(saved);
    } catch (err) {
      onChange(previous);
      setError(err instanceof Error ? err.message : "Failed to reorder videos.");
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const previous = [...videos];
    const current = [...videos];
    const fromIndex = current.findIndex((video) => video.id === draggingId);
    const toIndex = current.findIndex((video) => video.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setError(null);
    await reorder(
      previous,
      current.map((video, index) => ({ ...video, sortOrder: index })),
    );
    setDraggingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    setBusyId(id);
    setError(null);
    const previous = videos;
    try {
      const response = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Delete failed.");
      }
      onChange(videos.filter((video) => video.id !== id));
    } catch (err) {
      onChange(previous);
      setError(err instanceof Error ? err.message : "Failed to delete video.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (video: PortfolioVideo) => {
    setBusyId(video.id);
    setError(null);
    const previous = videos;
    try {
      const payload = new FormData();
      payload.set("featured", String(!video.featured));
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        body: payload,
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.error ?? "Update failed.");
      onChange(
        videos.map((item) =>
          item.id === video.id ? { ...item, ...(updated as PortfolioVideo) } : item,
        ),
      );
    } catch (err) {
      onChange(previous);
      setError(err instanceof Error ? err.message : "Failed to update video.");
    } finally {
      setBusyId(null);
    }
  };

  if (videos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brown/20 p-10 text-center text-sm text-muted">
        No videos yet. Use <span className="font-medium text-brown">Add video</span>{" "}
        to upload your first one.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl bg-pink/15 px-4 py-2 text-sm text-brown">{error}</p>
      )}

      <p className="text-sm text-muted">
        {videos.length} video{videos.length === 1 ? "" : "s"}
        {featuredCount > 0 && (
          <>
            {" "}
            · {featuredCount} featured on marquee
          </>
        )}
        <span className="hidden sm:inline"> · drag cards to reorder</span>
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {videos.map((video, index) => (
          <li
            key={video.id}
            draggable
            onDragStart={() => setDraggingId(video.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void handleDrop(video.id)}
            className={`group flex flex-col overflow-hidden rounded-2xl border border-brown/15 bg-cream/50 transition ${
              draggingId === video.id
                ? "scale-[0.98] opacity-50"
                : "hover:border-brown/25 hover:shadow-sm"
            }`}
          >
            <button
              type="button"
              onClick={() => onEdit(video)}
              className="relative aspect-[9/16] w-full overflow-hidden bg-brown/10 text-left"
            >
              <VideoThumbnail src={video.thumbnailPath} alt={video.title} />
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
                <span className="rounded-md bg-brown/55 px-1.5 py-0.5 font-label text-[10px] font-semibold tracking-wider text-paper uppercase backdrop-blur-sm">
                  #{index + 1}
                </span>
                <PlatformChip platform={video.platform} />
              </div>
              {video.featured && (
                <span className="absolute bottom-2 left-2 rounded-full bg-burgundy px-2 py-0.5 text-[10px] font-semibold text-paper">
                  Featured
                </span>
              )}
              <span className="absolute right-2 bottom-2 rounded-md bg-brown/55 px-1.5 py-0.5 text-[10px] font-medium text-paper backdrop-blur-sm">
                {formatDuration(video.durationSec)}
              </span>
            </button>

            <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
              <button
                type="button"
                onClick={() => onEdit(video)}
                className="text-left"
              >
                <p className="line-clamp-2 font-medium leading-snug text-brown">
                  {video.title || "Untitled video"}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">{video.brand}</p>
                {video.hook && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-indigo/80">
                    {video.hook}
                  </p>
                )}
              </button>

              <div
                className="mt-auto flex flex-wrap gap-1 border-t border-brown/10 pt-2"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onEdit(video)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-burgundy transition hover:bg-white/80"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busyId === video.id}
                  onClick={() => void toggleFeatured(video)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-indigo transition hover:bg-white/80 disabled:opacity-50"
                >
                  {video.featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  type="button"
                  disabled={busyId === video.id}
                  onClick={() => void handleDelete(video.id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-pink-deep transition hover:bg-white/80 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
