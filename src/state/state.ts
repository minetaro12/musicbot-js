import { AudioPlayer, AudioPlayerStatus, createAudioResource, StreamType, VoiceConnection } from "@discordjs/voice";
import type { Queue } from "../type/queue.ts";
import { getAudioStream } from "../lib/getAudioStream.ts";
import { client } from "../main.ts";
import { TextChannel } from "discord.js";
import { createEmbed } from "../lib/createEmbed.ts";
import prism from "prism-media";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";

export const GuildStates = new Map<string, State>();

const FFMPEG_OPUS_ARGUMENTS = [
  "-i", "-",
  "-analyzeduration", "0",
  "-acodec", "libopus",
  "-f", "opus",
  "-ar", "48000",
  "-ac", "2",
  "-af", "loudnorm,volume=0.3" // 音量の正規化と全体の音量を下げるフィルター
];

export class State {
  notifyChannelId: string;
  connection: VoiceConnection;
  player: AudioPlayer;
  queue: Queue[];
  nowPlaying?: Queue;
  isPlaying = false;
  playStartTime: number = 0;

  constructor(connection: VoiceConnection, notifyChannelId: string) {
    this.notifyChannelId = notifyChannelId;
    this.connection = connection;
    this.player = new AudioPlayer();
    this.queue = [];

    this.connection.subscribe(this.player);

    // 曲が終わったときに次の曲を再生する
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.isPlaying = false;
      this.playNext();
    });

    // 再生中にエラーが発生したときの処理
    this.player.on("error", error => {
      console.error(error);
      (client.channels.cache.get(this.notifyChannelId) as TextChannel).send({
        embeds: [
          createEmbed({
            title: "再生中にエラーが発生しました",
            color: "error"
          })
        ],
        ...DEFAULT_MESSAGE_OPTIONS
      });

      // スキップする
      this.skip(1);
    });
  }

  add(queue: Queue[]) {
    this.queue.push(...queue);

    // 再生中でなければ再生する
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      (client.channels.cache.get(this.notifyChannelId) as TextChannel)?.send({
        embeds: [
          createEmbed({
            title: "再生リストが終了しました",
            color: "info"
          })
        ],
        ...DEFAULT_MESSAGE_OPTIONS
      });
      return;
    }

    this.isPlaying = true;
    const next = this.queue.shift();
    this.nowPlaying = next;

    const stream = await getAudioStream(next!.url);

    // FFmpegでOpus形式に変換する&オーディオフィルターをかける
    const transcoder = new prism.FFmpeg({
      args: FFMPEG_OPUS_ARGUMENTS,
    });

    const convertedStream = stream.pipe(transcoder);

    const resource = createAudioResource(convertedStream, {
      inputType: StreamType.OggOpus
    });
    this.playStartTime = Date.now();
    this.player.play(resource);

    (client.channels.cache.get(this.notifyChannelId) as TextChannel).send({
      embeds: [
        createEmbed({
          title: "再生開始",
          description: next.title,
          thumbnail_url: (next.thumbnails && next.thumbnails[0].url) || "",
          color: "info"
        })
      ],
      ...DEFAULT_MESSAGE_OPTIONS
    });
  }

  getPlaybackProgress(): { current: number; total: number; percentage: number; } {
    if (!this.nowPlaying?.duration) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const elapsed = (Date.now() - this.playStartTime) / 1000; // 秒単位
    const total = this.nowPlaying.duration;
    const current = Math.min(elapsed, total); // 総長を超えないようにする

    return {
      current,
      total,
      percentage: (current / total) * 100
    };
  }

  skip(num: number) {
    if (num == 1) {
      this.player.stop();
    } else {
      this.queue.splice(0, num - 1);
      this.player.stop();
    }
  }

  destroy() {
    this.player.stop();
    this.connection.destroy();
    this.queue = [];
    this.nowPlaying = undefined;
  }
}
