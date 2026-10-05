import { spawn, type ChildProcess } from "child_process";
import { getCookieOption } from "./getCookieOption.ts";
import type { Readable } from "node:stream";

export const getAudioStream = async (url: string): Promise<{ stream: Readable; process: ChildProcess }> => {
  const ytDlp = spawn("yt-dlp", [
    url,
    "-o", "-",
    "-f", "ba/b",
    ...getCookieOption(),
    "--no-playlist",
    // "--quiet",
    // "--no-warnings",
    "--buffer-size", "16K",
    "--js-runtimes", "node"
  ]);

  ytDlp.stderr.on("data", (data) => {
    console.log(data.toString());
  });

  return {
    stream: ytDlp.stdout,
    process: ytDlp
  };
};
