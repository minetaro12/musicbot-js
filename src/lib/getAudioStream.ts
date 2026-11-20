import { spawn, type ChildProcess } from "child_process";
import { getCookieOption } from "./getCookieOption.ts";

export const getAudioStream = async (url: string): Promise<{ stream: NodeJS.ReadableStream; process: ChildProcess }> => {
  const ytDlp = spawn("yt-dlp", [
    url,
    "-o", "-",

    // web_embedded の HLS を使用する
    "--extractor-args",
    "youtube:player_client=web_embedded",

    // 音声付きHLSから低解像度を優先する
    "-f",
    "b[protocol^=m3u8][height<=144]/b[protocol^=m3u8]",

    ...getCookieOption(),
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
