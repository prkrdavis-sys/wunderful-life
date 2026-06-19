"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { sortVideos, uniqueVideosById } from "@/lib/videos/sort";
import { confirmLeaveDuringUpload } from "@/lib/admin/uploadGuard";
import { VideoForm } from "@/components/admin/VideoForm";
import { VideoList } from "@/components/admin/VideoList";

type AdminDashboardProps = {
  initialVideos: PortfolioVideo[];
  onVideosChange?: (videos: PortfolioVideo[]) => void;
  onUploadBusyChange?: (busy: boolean) => void;
};

type VideoView = "library" | "add";

const SECTIONS: { id: VideoView; label: string; hint: string }[] = [
  { id: "library", label: "All videos", hint: "Browse & manage" },
  { id: "add", label: "Add video", hint: "New upload" },
];

export function AdminDashboard({
  initialVideos,
  onVideosChange,
  onUploadBusyChange,
}: AdminDashboardProps) {
  const router = useRouter();
  const [videos, setVideos] = useState(() => uniqueVideosById(initialVideos));
  const [view, setView] = useState<VideoView>("library");
  const [editing, setEditing] = useState<PortfolioVideo | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    setVideos(uniqueVideosById(initialVideos));
  }, [initialVideos]);

  useEffect(() => {
    onUploadBusyChange?.(uploadBusy);
  }, [onUploadBusyChange, uploadBusy]);

  const commitVideos = useCallback(
    (next: PortfolioVideo[]) => {
      const sorted = sortVideos(uniqueVideosById(next));
      setVideos(sorted);
      onVideosChange?.(sorted);
      return sorted;
    },
    [onVideosChange],
  );

  const handleUploadBusyChange = useCallback((busy: boolean) => {
    setUploadBusy(busy);
  }, []);

  const trySetView = (next: VideoView) => {
    if (!confirmLeaveDuringUpload(uploadBusy)) return;
    setView(next);
  };

  const handleSuccess = (video: PortfolioVideo) => {
    setVideos((current) => {
      const next = sortVideos(
        uniqueVideosById(
          current.some((item) => item.id === video.id)
            ? current.map((item) => (item.id === video.id ? video : item))
            : [...current, video],
        ),
      );
      onVideosChange?.(next);
      return next;
    });
    setEditing(null);
    setView("library");
    router.refresh();
  };

  const handleEdit = (video: PortfolioVideo) => {
    if (!confirmLeaveDuringUpload(uploadBusy)) return;
    setEditing(video);
    setView("library");
  };

  const handleCancelEdit = () => {
    if (!confirmLeaveDuringUpload(uploadBusy)) return;
    setEditing(null);
  };

  if (editing) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <VideoForm
          key={editing.id}
          initial={editing}
          layout="panel"
          onSuccess={handleSuccess}
          onCancel={handleCancelEdit}
          onUploadBusyChange={handleUploadBusyChange}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <nav
        aria-label="Video sections"
        className="shrink-0 border-b border-brown/10 bg-cream/40 md:w-52 md:border-r md:border-b-0 lg:w-56"
      >
        <div className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:gap-0.5 md:overflow-visible md:px-3 md:py-4">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => trySetView(item.id)}
              className={`shrink-0 rounded-xl px-3 py-2 text-left transition md:w-full md:px-3 md:py-2.5 ${
                view === item.id
                  ? "bg-burgundy text-paper"
                  : "text-indigo hover:bg-white/80"
              }`}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span
                className={`hidden text-xs md:block ${
                  view === item.id ? "text-paper/75" : "text-muted"
                }`}
              >
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {view === "library" ? (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Video library</h3>
                <p className="mt-1 text-sm text-muted">
                  Thumbnails, platforms, and featured status at a glance.
                </p>
              </div>
              <VideoList
                videos={videos}
                onEdit={handleEdit}
                onChange={commitVideos}
              />
            </section>
          ) : (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-brown">Add video</h3>
                <p className="mt-1 text-sm text-muted">
                  Pick your files first — they upload while you fill in the details.
                </p>
              </div>
              <VideoForm
                key="new"
                layout="panel"
                embedded
                onSuccess={handleSuccess}
                onUploadBusyChange={handleUploadBusyChange}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
