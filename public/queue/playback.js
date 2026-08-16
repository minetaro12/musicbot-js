export const createPlaybackSnapshot = (playback, receivedAt) => {
  const total = Number.isFinite(playback?.total) && playback.total > 0 ? playback.total : 0;
  const current = Number.isFinite(playback?.current)
    ? Math.min(Math.max(playback.current, 0), total)
    : 0;

  return {
    current,
    total,
    percentage: total === 0 ? 0 : (current / total) * 100,
    isPlaying: playback?.isPlaying === true,
    receivedAt
  };
};

export const getPlaybackPosition = (snapshot, now) => {
  const elapsed = snapshot.isPlaying
    ? Math.max(now - snapshot.receivedAt, 0) / 1000
    : 0;

  return Math.min(snapshot.current + elapsed, snapshot.total);
};

export const formatTime = (seconds) => {
  const wholeSeconds = Number.isFinite(seconds) ? Math.max(Math.floor(seconds), 0) : 0;
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
