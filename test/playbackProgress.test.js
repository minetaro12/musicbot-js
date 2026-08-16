import assert from "node:assert/strict";
import test from "node:test";
import { calculatePlaybackProgress } from "../src/lib/playbackProgress.ts";

test("reports AudioResource playback duration in seconds", () => {
  assert.deepEqual(calculatePlaybackProgress(42_500, 120, true), {
    current: 42.5,
    total: 120,
    percentage: 35.41666666666667,
    isPlaying: true
  });
});

test("keeps the measured position while playback is buffering", () => {
  assert.deepEqual(calculatePlaybackProgress(42_500, 120, false), {
    current: 42.5,
    total: 120,
    percentage: 35.41666666666667,
    isPlaying: false
  });
});

test("clamps playback at the track duration", () => {
  assert.deepEqual(calculatePlaybackProgress(130_000, 120, true), {
    current: 120,
    total: 120,
    percentage: 100,
    isPlaying: true
  });
});

test("returns a safe empty progress for missing or invalid durations", () => {
  assert.deepEqual(calculatePlaybackProgress(Number.NaN, Number.NaN, false), {
    current: 0,
    total: 0,
    percentage: 0,
    isPlaying: false
  });

  assert.deepEqual(calculatePlaybackProgress(-1, -1, false), {
    current: 0,
    total: 0,
    percentage: 0,
    isPlaying: false
  });
});
