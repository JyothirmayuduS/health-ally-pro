import { ExternalLink } from "lucide-react";
import type { DietYoutubeVideo } from "@/lib/diet-mock-data";
import {
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from "@/lib/diet-youtube-curated";

type Props = {
  video: DietYoutubeVideo;
};

export function DietYoutubeEmbed({ video }: Props) {
  const watchUrl = youtubeWatchUrl(video.videoId);

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#EDEAE6] bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-video w-full bg-ink/5">
        <iframe
          title={video.title}
          src={youtubeEmbedUrl(video.videoId)}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <img
          src={youtubeThumbnailUrl(video.videoId)}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-0"
        />
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{video.title}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {video.channel}
            {video.viewCount ? ` · ${video.viewCount} views` : ""}
            {video.likeCount ? ` · ${video.likeCount} likes` : ""}
            {` · ${video.language.toUpperCase()}`}
          </p>
        </div>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#EDEAE6] px-3 py-1.5 text-xs font-semibold text-clay transition-colors hover:border-clay/40"
        >
          Open
          <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
        </a>
      </div>
    </div>
  );
}
