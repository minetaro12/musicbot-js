import { spawn } from "child_process";
import type { Queue } from "../type/queue.ts";
import { getCookieOption } from "./getCookieOption.ts";

export const getStreamInfo = async (url: string): Promise<Queue[]> => {
  const ytDlp = spawn("yt-dlp", [
    url,
    "--flat-playlist",
    "--print", "%(.{title,url,thumbnails})j",
    ...getCookieOption(),
    // "--quiet",
    // "--no-warnings",
    "--js-runtimes", "node"
  ]);

  ytDlp.stderr.on("data", (data) => {
    console.log(data.toString());
  });

  // 出力されたJSONをパースして返す
  const chunks: Buffer[] = [];
  for await (const chunk of ytDlp.stdout) {
    chunks.push(chunk);
  }

  const output = Buffer.concat(chunks).toString();
  const lines = output.split("\n").filter(line => line.trim() !== "");

  // 動画が一つだとurlが空になるので、その場合は動画情報を直接返す
  if (lines.length === 1) {
    const info = JSON.parse(lines[0]);
    return [{
      url: url,
      title: info.title,
      thumbnails: info.thumbnails
    }];
  }

  return lines.map(line => JSON.parse(line));
};
