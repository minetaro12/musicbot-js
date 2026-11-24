import { spawn, type ChildProcess } from "child_process";
import { getYoutubeOptions } from "./getYoutubeOptions.ts";

export const getAudioStream = async (url: string): Promise<{ stream: NodeJS.ReadableStream; process: ChildProcess }> => {
  const ytDlp = spawn("yt-dlp", [
    url,
    "-o", "-",

    // mweb には HLS 144p がないため、音声のみ取得して帯域を節約
    "-f",
    "ba/b",

    ...getYoutubeOptions(),
    "--no-playlist",
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
