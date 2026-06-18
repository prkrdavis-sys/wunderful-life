"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { sortVideos, uniqueVideosById } from "@/lib/videos/sort";
import { VideoForm } from "@/components/admin/VideoForm";
import { VideoList } from "@/components/admin/VideoList";

type AdminDashboardProps = {
  initialVideos: PortfolioVideo[];
  onVideosChange?: (videos: PortfolioVideo[]) => void;
};

export function AdminDashboard({
  initialVideos,
  onVideosChange,
}: AdminDashboardProps) {
  const router = useRouter();
  const [videos, setVideos] = useState(() => uniqueVideosById(initialVideos));
  const [editing, setEditing] = useState<PortfolioVideo | null>(null);

  useEffect(() => {
    setVideos(uniqueVideosById(initialVideos));
  }, [initialVideos]);

  const commitVideos = useCallback(
    (next: PortfolioVideo[]) => {
      const sorted = sortVideos(uniqueVideosById(next));
      setVideos(sorted);
      onVideosChange?.(sorted);
      return sorted;
    },
    [onVideosChange],
  );

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
    setEditing((current) => (current?.id === video.id ? video : current));
    router.refresh();
  };

  if (editing) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <VideoForm
          key={editing.id}
          initial={editing}
          layout="panel"
          onSuccess={handleSuccess}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto overscroll-contain py-6">
      <VideoForm key="new" onSuccess={handleSuccess} />

      <section>
        <h2 className="mb-4 font-display text-2xl text-brown">Your Videos</h2>
        <VideoList
          videos={videos}
          onEdit={setEditing}
          onChange={commitVideos}
        />
      </section>
    </div>
  );
}
