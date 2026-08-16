import { AudioPlayer, AudioPlayerStatus, createAudioResource, StreamType, VoiceConnection, type AudioResource } from "@discordjs/voice";
import type { ChildProcess } from "child_process";
import type { Queue } from "../type/queue.ts";
import type { PlaybackProgress } from "../type/playback.ts";
import { getAudioStream } from "../lib/getAudioStream.ts";
import { calculatePlaybackProgress } from "../lib/playbackProgress.ts";
import { client, io } from "../main.ts";
import { TextChannel } from "discord.js";
import { createEmbed } from "../lib/createEmbed.ts";
import prism from "prism-media";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";

export const GuildStates = new Map<string, State>();

export type StateUpdate = {
  nowPlaying?: Queue;
  queue: Queue[];
  playback: PlaybackProgress;
};

// トークン生成関数
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

const FFMPEG_OPUS_ARGUMENTS = [
  "-i", "-",
  "-analyzeduration", "0",
  "-acodec", "libopus",
  "-f", "opus",
  "-ar", "48000",
  "-ac", "2",
  // 約1秒先読みし、冒頭から安定した小さめの音量に正規化する
  "-af", "dynaudnorm=framelen=250:gausssize=9:peak=0.24:maxgain=3:targetrms=0.02:coupling=true:altboundary=true"
];

export class State {
  notifyChannelId: string;
  guildId: string;
  connection: VoiceConnection;
  player: AudioPlayer;
  queue: Queue[];
  nowPlaying?: Queue;
  isPlaying = false;
  currentResource?: AudioResource;
  token: string;
  emptyChannelTimeout?: NodeJS.Timeout;
  ytDlpProcess?: ChildProcess;

  constructor(connection: VoiceConnection, notifyChannelId: string, guildId: string) {
    this.notifyChannelId = notifyChannelId; this.guildId = guildId; this.connection = connection;
    this.player = new AudioPlayer();
    this.queue = [];
    this.token = generateToken();

    this.connection.subscribe(this.player);

    // 曲が終わったときに次の曲を再生する
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.isPlaying = false;
      this.currentResource = undefined;
      void this.playNext();
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
    } else {
      // 再生中の場合は状態を通知
      this.emitStateUpdate();
    }
  }

  async playNext() {
    if (this.queue.length === 0) {
      this.nowPlaying = undefined;
      this.isPlaying = false;
      this.currentResource = undefined;
      (client.channels.cache.get(this.notifyChannelId) as TextChannel)?.send({
        embeds: [
          createEmbed({
            title: "再生リストが終了しました",
            color: "info"
          })
        ],
        ...DEFAULT_MESSAGE_OPTIONS
      });

      this.emitStateUpdate();

      return;
    }

    this.isPlaying = true;
    const next = this.queue.shift();
    this.nowPlaying = next;
    this.emitStateUpdate();

    const { stream, process: ytDlpProcess } = await getAudioStream(next!.url);
    this.ytDlpProcess = ytDlpProcess;

    // FFmpegでOpus形式に変換する&オーディオフィルターをかける
    const transcoder = new prism.FFmpeg({
      args: FFMPEG_OPUS_ARGUMENTS,
    });

    const convertedStream = stream.pipe(transcoder);

    const resource = createAudioResource(convertedStream, {
      inputType: StreamType.OggOpus
    });
    this.currentResource = resource;
    this.player.play(resource);

    // WebSocketでクライアントに再生開始を通知する
    this.emitStateUpdate();

    (client.channels.cache.get(this.notifyChannelId) as TextChannel).send({
      embeds: [
        createEmbed({
          title: "再生開始",
          description: next?.title || "",
          thumbnail_url: (next?.thumbnails && next.thumbnails[0]?.url) || "",
          color: "info"
        })
      ],
      ...DEFAULT_MESSAGE_OPTIONS
    });
  }

  getPlaybackProgress(): PlaybackProgress {
    return calculatePlaybackProgress(
      this.currentResource?.playbackDuration ?? 0,
      this.nowPlaying?.duration ?? 0,
      this.player.state.status === AudioPlayerStatus.Playing
    );
  }

  getStateUpdate(): StateUpdate {
    return {
      nowPlaying: this.nowPlaying,
      queue: this.queue,
      playback: this.getPlaybackProgress()
    };
  }

  private emitStateUpdate() {
    io.to(this.guildId).emit("stateUpdate", this.getStateUpdate());
  }

  skip(num: number) {
    // yt-dlpプロセスを強制終了
    if (this.ytDlpProcess) {
      this.ytDlpProcess.kill('SIGKILL');
      this.ytDlpProcess = undefined;
    }

    if (num == 1) {
      this.player.stop();
    } else {
      this.queue.splice(0, num - 1);
      this.player.stop();
    }

  }

  startEmptyChannelTimer() {
    // 既存のタイマーをクリア
    if (this.emptyChannelTimeout) {
      clearTimeout(this.emptyChannelTimeout);
    }

    // 15分後に自動切断
    this.emptyChannelTimeout = setTimeout(() => {
      this.destroy();
      GuildStates.delete(this.guildId);

      const textChannel = client.channels.cache.get(this.notifyChannelId) as TextChannel;
      textChannel?.send({
        embeds: [
          createEmbed({
            title: "15分間、ボットが VCに一人だったため切断しました",
            color: "info"
          })
        ],
        ...DEFAULT_MESSAGE_OPTIONS
      });
    }, 15 * 60 * 1000);
  }

  // VCにメンバーが戻ったときに呼び出す
  cancelEmptyChannelTimer() {
    if (this.emptyChannelTimeout) {
      clearTimeout(this.emptyChannelTimeout);
      this.emptyChannelTimeout = undefined;
    }
  }

  destroy() {
    // yt-dlpプロセスを強制終了
    if (this.ytDlpProcess) {
      this.ytDlpProcess.kill('SIGKILL');
      this.ytDlpProcess = undefined;
    }

    this.player.stop();
    this.connection.destroy();
    this.queue = [];
    this.nowPlaying = undefined;
    this.currentResource = undefined;
    this.isPlaying = false;
  }
}
