import { WorkPageClient } from "@/components/work/WorkPageClient";
import { PlantSectionBackground } from "@/components/ui/PlantSectionBackground";
import { sectionWallpapers } from "@/lib/plants";
import { paperTextGlow, sectionText } from "@/lib/sectionText";
import { getSiteContent } from "@/lib/site";
import { listVideos } from "@/lib/storage";

export const metadata = {
  title: "Work",
};

type WorkPageProps = {
  searchParams: Promise<{ tag?: string }>;
};

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const site = await getSiteContent();
  const { tag } = await searchParams;
  const videos = await listVideos();
  const { wallpaper, overlay } = sectionWallpapers.workPage;
  const text = sectionText.services;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-16 sm:px-6">
      <PlantSectionBackground wallpaper={wallpaper} overlay={overlay} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <p
          className={`text-sm font-semibold tracking-[0.2em] text-burgundy uppercase ${paperTextGlow}`}
        >
          Portfolio
        </p>
        <h1 className={`mt-2 font-display text-4xl sm:text-5xl ${text.heading}`}>
          {site.name}&apos;s UGC Work
        </h1>
        <p className={`mt-4 max-w-2xl ${text.body}`}>
          Drag through the carousel, filter by platform or tag, and tap any
          phone to play.
        </p>
        <WorkPageClient initialVideos={videos} initialTag={tag} />
      </div>
    </div>
  );
}
