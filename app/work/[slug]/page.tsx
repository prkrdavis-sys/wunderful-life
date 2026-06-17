import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailVideoPlayer } from "@/components/work/DetailVideoPlayer";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { SectionReveal } from "@/components/ui/motion";
import {
  formatDuration,
  platformLabel,
} from "@/lib/videos/types";
import { getVideoBySlug, listVideos } from "@/lib/storage";

type WorkDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const videos = await listVideos();
  return videos.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({ params }: WorkDetailPageProps) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) return { title: "Not Found" };
  return {
    title: video.title,
    description: video.hook,
  };
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) notFound();

  const metadataItems = [
    { label: "Brand", value: video.brand },
    { label: "Platform", value: platformLabel(video.platform) },
    { label: "Duration", value: formatDuration(video.durationSec) },
    { label: "Hook", value: video.hook },
    { label: "CTA", value: video.cta },
  ];

  return (
    <div className="section-wash-pink relative min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <AnimatedButton href="/work" variant="ghost" className="mb-8">
          ← Back to Work
        </AnimatedButton>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <SectionReveal>
            <DetailVideoPlayer video={video} />
          </SectionReveal>

          <div>
            <SectionReveal delay={0.1}>
              <h1 className="font-display text-3xl text-brown sm:text-4xl">
                {video.title}
              </h1>
              <p className="mt-2 text-lg text-muted">{video.brand}</p>
            </SectionReveal>

            <SectionReveal delay={0.15} className="mt-8 space-y-4">
              {metadataItems.map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border-2 border-brown/10 bg-white/70 p-4 backdrop-blur-sm"
                >
                  <h2 className="font-label text-xs font-semibold tracking-[0.18em] text-pink-deep uppercase">
                    {item.label}
                  </h2>
                  <p className="mt-2 text-brown">{item.value}</p>
                </article>
              ))}
            </SectionReveal>

            {video.tags.length > 0 && (
              <SectionReveal delay={0.2} className="mt-6">
                <h2 className="font-label text-xs font-semibold tracking-[0.18em] text-burgundy uppercase">
                  Tags
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {video.tags.map((value) => (
                    <Link
                      key={value}
                      href={`/work?tag=${encodeURIComponent(value)}`}
                      className="rounded-full border border-lavender/40 bg-lavender/25 px-3 py-1 text-sm text-indigo backdrop-blur-sm hover:border-burgundy/35 hover:text-burgundy"
                    >
                      #{value}
                    </Link>
                  ))}
                </div>
              </SectionReveal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
