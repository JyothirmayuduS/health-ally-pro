import { ExternalLink } from "lucide-react";
import type { ExerciseYoutubeVideo } from "@/lib/exercise-mock-data";
import {
  youtubeEmbedUrl,
  youtubeWatchUrl,
} from "@/lib/exercise-youtube-curated";

type Props = {
  video: ExerciseYoutubeVideo;
  compact?: boolean;
};

export function ExerciseYoutubeEmbed({ video, compact = false }: Props) {
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
      </div>
      {!compact ? (
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold text-ink">{video.title}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {video.channel}
              {video.durationLabel ? ` · ${video.durationLabel}` : ""}
              {video.viewCount ? ` · ${video.viewCount} views` : ""}
              {` · ${video.language.toUpperCase()}`}
            </p>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              Short, beginner-friendly tutorial — follow at your own pace.
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
      ) : null}
    </div>
  );
}
