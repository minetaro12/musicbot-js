import assert from "node:assert/strict";
import test from "node:test";
import {
  createPlaybackSnapshot,
  getPlaybackPosition
} from "../public/queue/playback.js";

test("interpolates from the received monotonic timestamp", () => {
  const snapshot = createPlaybackSnapshot({
    current: 10,
    total: 120,
    isPlaying: true
  }, 1_000);

  assert.equal(getPlaybackPosition(snapshot, 3_500), 12.5);
});

test("does not advance while playback is buffering or stopped", () => {
  const snapshot = createPlaybackSnapshot({
    current: 10,
    total: 120,
    isPlaying: false
  }, 1_000);

  assert.equal(getPlaybackPosition(snapshot, 30_000), 10);
});

test("clamps interpolated progress at the track duration", () => {
  const snapshot = createPlaybackSnapshot({
    current: 119.5,
    total: 120,
    isPlaying: true
  }, 1_000);

  assert.equal(getPlaybackPosition(snapshot, 3_000), 120);
});

test("ignores a monotonic timestamp that moves backwards", () => {
  const snapshot = createPlaybackSnapshot({
    current: 10,
    total: 120,
    isPlaying: true
  }, 2_000);

  assert.equal(getPlaybackPosition(snapshot, 1_000), 10);
});
