import type { PlaybackProgress } from "../type/playback.ts";

export const calculatePlaybackProgress = (
  playbackDurationMs: number,
  totalDurationSeconds: number,
  isPlaying: boolean
): PlaybackProgress => {
  const total = Number.isFinite(totalDurationSeconds) && totalDurationSeconds > 0
    ? totalDurationSeconds
    : 0;
  const elapsed = Number.isFinite(playbackDurationMs) && playbackDurationMs > 0
    ? playbackDurationMs / 1000
    : 0;
  const current = Math.min(elapsed, total);

  return {
    current,
    total,
    percentage: total === 0 ? 0 : (current / total) * 100,
    isPlaying
  };
};
