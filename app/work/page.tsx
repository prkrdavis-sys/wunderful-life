import { WorkPageClient } from "@/components/work/WorkPageClient";
import { getSiteContent } from "@/lib/site";
import { listVideos } from "@/lib/storage";

export const metadata = {
  title: "Work",
};

type WorkPageProps = {
  searchParams: Promise<{ tag?: string }>;
};

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const site = getSiteContent();
  const { tag } = await searchParams;
  const videos = await listVideos();

  return (
    <div className="section-wash-green relative min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold tracking-[0.2em] text-pink-deep uppercase">
          Portfolio
        </p>
        <h1 className="mt-2 font-display text-4xl text-brown sm:text-5xl">
          {site.name}&apos;s UGC Work
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Drag through the carousel, filter by platform or tag, and tap any
          phone to play.
        </p>
        <WorkPageClient initialVideos={videos} initialTag={tag} />
      </div>
    </div>
  );
}
