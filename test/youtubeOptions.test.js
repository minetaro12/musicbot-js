import assert from "node:assert/strict";
import test from "node:test";
import { getYoutubeOptions } from "../src/lib/getYoutubeOptions.ts";

const withEnv = (values, fn) => {
  const keys = Object.keys(values);
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) {
      if (values[key] === undefined) delete process.env[key];
      else process.env[key] = values[key];
    }
    fn();
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
};

test("uses mweb client without a provider URL by default", () => {
  withEnv({ YOUTUBE_PLAYER_CLIENT: undefined, POT_PROVIDER_BASE_URL: undefined }, () => {
    const options = getYoutubeOptions();
    assert.ok(options.includes("youtube:player_client=mweb"));
    assert.ok(!options.some((option) => option.startsWith("youtubepot-bgutilhttp:")));
  });
});

test("passes the provider URL as a separate extractor argument", () => {
  withEnv(
    { POT_PROVIDER_BASE_URL: "http://pot-provider:4416", YOUTUBE_PLAYER_CLIENT: "mweb" },
    () => {
      assert.deepEqual(getYoutubeOptions(), [
        "--extractor-args",
        "youtube:player_client=mweb",
        "--extractor-args",
        "youtubepot-bgutilhttp:base_url=http://pot-provider:4416"
      ]);
    }
  );
});
