"use client";

import { useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { formatDuration, platformLabel } from "@/lib/videos/types";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { VideoThumbnail } from "@/components/ui/VideoThumbnail";

type VideoListProps = {
  videos: PortfolioVideo[];
  onEdit: (video: PortfolioVideo) => void;
  onChange: (videos: PortfolioVideo[]) => void;
};

export function VideoList({ videos, onEdit, onChange }: VideoListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <p className="rounded-2xl border border-dashed border-brown/20 p-8 text-center text-muted">
        No videos yet. Add your first upload above.
      </p>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded-xl bg-pink/20 px-4 py-2 text-sm text-brown">
          {error}
        </p>
      )}
      <ul className="space-y-4">
        {videos.map((video) => (
          <li
            key={video.id}
            draggable
            onDragStart={() => setDraggingId(video.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void handleDrop(video.id)}
            className={`flex flex-col gap-4 rounded-2xl border-2 border-brown/10 bg-white/80 p-4 sm:flex-row sm:items-center ${
              draggingId === video.id ? "opacity-50" : ""
            }`}
          >
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-brown/10">
            <VideoThumbnail src={video.thumbnailPath} alt={video.title} />
          </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-brown">
                {video.title || "Untitled video"}
              </p>
              <p className="text-sm text-muted">
                {video.brand} · {platformLabel(video.platform)} ·{" "}
                {formatDuration(video.durationSec)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Drag to reorder · {video.featured ? "Featured" : "Not featured"}
              </p>
            </div>

            <div
              className="flex flex-wrap gap-2"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <AnimatedButton
                type="button"
                variant="ghost"
                className="px-4 py-2 text-xs"
                onClick={() => onEdit(video)}
              >
                Edit
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="secondary"
                className="px-4 py-2 text-xs"
                disabled={busyId === video.id}
                onClick={() => void toggleFeatured(video)}
              >
                {video.featured ? "Unfeature" : "Feature"}
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="ghost"
                className="px-4 py-2 text-xs text-pink-deep"
                disabled={busyId === video.id}
                onClick={() => void handleDelete(video.id)}
              >
                Delete
              </AnimatedButton>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
