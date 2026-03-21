import { spawn } from "child_process";
import { getCookieOption } from "./getCookieOption.ts";

export const getAudioStream = async (url: string) => {
  const ytDlp = spawn("yt-dlp", [
    url,
    "-o", "-",
    "-f", "bestaudio",
    ...getCookieOption(),
    "--no-playlist",
    // "--quiet",
    // "--no-warnings",
    "--buffer-size", "16K"
  ]);

  ytDlp.stderr.on("data", (data) => {
    console.log(data.toString());
  });

  return ytDlp.stdout;
};
