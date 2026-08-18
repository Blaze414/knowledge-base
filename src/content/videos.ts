/**
 * Central registry of YouTube videos used in the knowledge base.
 *
 * Add a new entry here, then reference it from any article content using
 * a token on its own line:
 *
 *     [video:intro]
 *     [video:setup]
 *
 * Values can be a full YouTube URL (watch / youtu.be / shorts / embed) or
 * a raw 11-character video ID — both are accepted by `extractYouTubeId`.
 */
export const videos = {
  intro: "https://www.youtube.com/watch?v=iTssF_NYusQ",
  setup: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  firstProject: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  roles: "https://www.youtube.com/watch?v=L_jWHffIx5E",
  validation: "https://www.youtube.com/watch?v=9bZkp7q19f0",
} as const;

export type VideoKey = keyof typeof videos;

export function getVideo(key: string): string | undefined {
  return (videos as Record<string, string>)[key];
}
