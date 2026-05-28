"use client";

import { useState } from "react";
import type { PortfolioVideo } from "@/lib/videos/types";
import { VideoForm } from "@/components/admin/VideoForm";
import { VideoList } from "@/components/admin/VideoList";

type AdminDashboardProps = {
  initialVideos: PortfolioVideo[];
};

export function AdminDashboard({ initialVideos }: AdminDashboardProps) {
  const [videos, setVideos] = useState(initialVideos);
  const [editing, setEditing] = useState<PortfolioVideo | null>(null);

  const handleSuccess = (video: PortfolioVideo) => {
    setVideos((current) => {
      const exists = current.some((item) => item.id === video.id);
      if (exists) {
        return current
          .map((item) => (item.id === video.id ? video : item))
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }
      return [...current, video].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    setEditing(null);
  };

  return (
    <div className="space-y-10">
      <VideoForm
        key={editing?.id ?? "new"}
        initial={editing}
        onSuccess={handleSuccess}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <section>
        <h2 className="mb-4 font-display text-2xl text-brown">Your Videos</h2>
        <VideoList
          videos={videos}
          onEdit={setEditing}
          onChange={setVideos}
        />
      </section>
    </div>
  );
}
