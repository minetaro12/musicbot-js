import { AudioPlayer, AudioPlayerStatus, createAudioResource, StreamType, VoiceConnection } from "@discordjs/voice";
import type { Queue } from "../type/queue.ts";
import { getAudioStream } from "../lib/getAudioStream.ts";
import { client } from "../main.ts";
import { TextChannel } from "discord.js";
import { createEmbed } from "../lib/createEmbed.ts";

export const GuildStates = new Map<string, State>();

export class State {
  notifyChannelId: string;
  connection: VoiceConnection;
  player: AudioPlayer;
  queue: Queue[];
  nowPlaying?: Queue;
  isPlaying = false;

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
    this.player.on('error', error => {
      console.error(error);
      (client.channels.cache.get(this.notifyChannelId) as TextChannel).send({
        embeds: [
          createEmbed({
            title: "再生中にエラーが発生しました",
            color: "error"
          })
        ]
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
        flags: ["SuppressNotifications"]
      });
      return;
    }

    this.isPlaying = true;
    const next = this.queue.shift();
    this.nowPlaying = next;

    const stream = await getAudioStream(next!.url);
    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary
    });
    this.player.play(resource);

    (client.channels.cache.get(this.notifyChannelId) as TextChannel).send({
      embeds: [
        createEmbed({
          title: "再生開始",
          description: next!.title,
          thumbnail_url: next!.thumbnails[0]?.url,
          color: "info"
        })
      ],
      flags: ["SuppressNotifications"]
    });
  }

  skip(num: number) {
    if (num == 1) {
      this.player.stop();
    } else {
      this.queue.splice(0, num - 1);
      this.player.stop();
    }

    (client.channels.cache.get(this.notifyChannelId) as TextChannel).send({
      embeds: [
        createEmbed({
          title: `${num}曲スキップしました`,
          color: "info"
        })
      ],
      flags: ["SuppressNotifications"]
    });
  }

  destroy() {
    this.player.stop();
    this.connection.destroy();
    this.queue = [];
    this.nowPlaying = undefined;
  }
}
