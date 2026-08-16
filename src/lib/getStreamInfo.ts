import { spawn } from "child_process";
import type { Queue } from "../type/queue.ts";
import { getCookieOption } from "./getCookieOption.ts";

export const getStreamInfo = async (url: string): Promise<Queue[]> => {
  const ytDlp = spawn("yt-dlp", [
    url,
    "--flat-playlist",
    "--print", "%(.{title,url,thumbnails,duration})j",
    ...getCookieOption(),
    // "--quiet",
    // "--no-warnings",
    "--js-runtimes", "node"
  ]);

  const stderrChunks: Buffer[] = [];
  ytDlp.stderr.on("data", (data) => {
    const text = data.toString();
    console.log(text);
    stderrChunks.push(Buffer.from(text));
  });

  const chunks: Buffer[] = [];
  const stdoutPromise = (async () => {
    for await (const chunk of ytDlp.stdout) {
      chunks.push(chunk);
    }
  })();

  const exitCode = await new Promise<number>((resolve, reject) => {
    ytDlp.on("error", reject);
    ytDlp.on("close", (code) => resolve(code ?? 0));
  });

  await stdoutPromise;

  // 出力されたJSONをパースして返す
  const output = Buffer.concat(chunks).toString();
  const lines = output.split("\n").filter(line => line.trim() !== "");

  if (exitCode !== 0) {
    const errorMessage = Buffer.concat(stderrChunks).toString().trim();
    throw new Error(errorMessage || "検索に失敗しました");
  }

  // 動画が一つだとurlが空になるので、その場合は動画情報を直接返す
  if (lines.length === 1) {
    const info = JSON.parse(lines[0]);
    return [{
      url: url,
      title: info.title,
      thumbnails: info.thumbnails,
      duration: info.duration
    }];
  }

  return lines.map(line => {
    const info = JSON.parse(line);
    return {
      url: info.url,
      title: info.title,
      thumbnails: info.thumbnails,
      duration: info.duration
    };
  });
};
