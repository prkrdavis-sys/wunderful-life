import { AutoResizeTextarea } from "@/components/admin/AutoResizeTextarea";
import { useAdminView } from "@/components/admin/AdminViewProvider";
import { cardClass, inputClass } from "@/components/admin/site-editor/constants";
import { VideoThumbnail } from "@/components/ui/VideoThumbnail";
import type {
  SiteEditorFieldsProps,
  SiteEditorWorkProps,
} from "@/components/admin/site-editor/types";

export function WorkEditor({
  form,
  setForm,
  portfolioVideos,
  portfolioVideosLoaded,
}: Pick<SiteEditorFieldsProps, "form" | "setForm"> & SiteEditorWorkProps) {
  const { openPortfolioEditor } = useAdminView();
  const featuredPortfolioVideos = portfolioVideos.filter((video) => video.featured);
  const marqueeVideos =
    featuredPortfolioVideos.length > 0
      ? featuredPortfolioVideos
      : portfolioVideos;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-brown">Videos section</h3>
        <p className="mt-1 text-sm text-muted">
          Phone carousel clips live in the Videos tab. Mark a video “Show in
          carousel” to feature it there. If none are marked, every uploaded clip
          appears. Below, edit the cursive section title.
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-label text-xs font-semibold tracking-[0.12em] text-muted uppercase">
              Carousel videos
            </p>
            <p className="mt-1 text-sm text-muted">
              Currently shown in the phone carousel
            </p>
          </div>
          <button
            type="button"
            onClick={openPortfolioEditor}
            className="rounded-full border border-forest/30 bg-forest px-3 py-1.5 text-sm font-medium text-paper transition hover:bg-forest-deep"
          >
            Manage videos
          </button>
        </div>

        {!portfolioVideosLoaded ? (
          <p className="text-sm text-muted">Loading uploaded videos…</p>
        ) : portfolioVideos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brown/20 bg-white/60 px-4 py-6 text-center">
            <p className="text-sm text-muted">No videos uploaded yet.</p>
            <button
              type="button"
              onClick={openPortfolioEditor}
              className="mt-3 text-sm font-medium text-forest underline-offset-2 hover:underline"
            >
              Upload your first video
            </button>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {marqueeVideos.map((video) => (
                <li
                  key={video.id}
                  className="overflow-hidden rounded-xl border border-brown/15 bg-white"
                >
                  <div className="relative aspect-[9/16] bg-brown/10">
                    <VideoThumbnail
                      src={video.thumbnailPath}
                      alt={video.title}
                      videoSrc={video.videoPath}
                    />
                    {video.featured && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-forest px-1.5 py-0.5 text-[10px] font-semibold text-paper">
                        In carousel
                      </span>
                    )}
                  </div>
                  <p className="truncate px-2 py-1.5 text-xs font-medium text-brown">
                    {video.title || "Untitled"}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              {featuredPortfolioVideos.length > 0 ? (
                <p className="flex max-w-full items-start gap-1.5 rounded-full bg-lavender/35 px-2.5 py-1 text-xs font-medium break-words text-ink">
                  <span aria-hidden>🌸</span>
                  {featuredPortfolioVideos.length} live on your site
                </p>
              ) : (
                <p className="text-xs text-muted">
                  No videos are marked for the carousel yet — showing all{" "}
                  {portfolioVideos.length} as a fallback.
                </p>
              )}
              {featuredPortfolioVideos.length === 0 && (
                <button
                  type="button"
                  onClick={openPortfolioEditor}
                  className="text-xs font-medium text-forest underline-offset-2 hover:underline"
                >
                  Choose featured clips
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <label className="block max-w-2xl text-sm">
        <span className="text-muted">Section title (cursive)</span>
        <AutoResizeTextarea
          value={form.work.heading}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              work: { ...current.work, heading: event.target.value },
            }))
          }
          className={inputClass}
        />
      </label>
    </section>
  );
}
