"use client";

import { useMemo, useState } from "react";
import { PhoneCarousel } from "@/components/phone/PhoneCarousel";
import { FilterChip } from "@/components/ui/motion";
import { collectTags, filterVideos } from "@/lib/videos/filter";
import type { Platform, PortfolioVideo } from "@/lib/videos/types";
import { PLATFORMS, platformLabel } from "@/lib/videos/types";

type WorkPageClientProps = {
  initialVideos: PortfolioVideo[];
  initialTag?: string;
};

function resolveInitialTag(
  initialTag: string | undefined,
  videos: PortfolioVideo[],
): string | "all" {
  if (!initialTag) return "all";
  const tags = collectTags(videos);
  return tags.includes(initialTag) ? initialTag : "all";
}

export function WorkPageClient({
  initialVideos,
  initialTag,
}: WorkPageClientProps) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [tag, setTag] = useState<string | "all">(() =>
    resolveInitialTag(initialTag, initialVideos),
  );

  const tags = useMemo(() => collectTags(initialVideos), [initialVideos]);

  const filtered = useMemo(
    () =>
      filterVideos(initialVideos, {
        platform,
        tag,
      }),
    [initialVideos, platform, tag],
  );

  return (
    <div className="mt-10">
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip active={platform === "all"} onClick={() => setPlatform("all")}>
          All platforms
        </FilterChip>
        {PLATFORMS.map((value) => (
          <FilterChip
            key={value}
            active={platform === value}
            onClick={() => setPlatform(value)}
          >
            {platformLabel(value)}
          </FilterChip>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip active={tag === "all"} onClick={() => setTag("all")}>
            All tags
          </FilterChip>
          {tags.map((value) => (
            <FilterChip
              key={value}
              active={tag === value}
              onClick={() => setTag(value)}
            >
              #{value}
            </FilterChip>
          ))}
        </div>
      )}

      <PhoneCarousel videos={filtered} size="lg" />
    </div>
  );
}
