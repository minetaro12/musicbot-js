import type { Message, OmitPartialGroupDMChannel } from "discord.js";
import parse from "yargs-parser";
import { createEmbed } from "../lib/createEmbed.ts";
import { GuildStates } from "../state/state.ts";
import { getStreamInfo } from "../lib/getStreamInfo.ts";

export const playHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const url = parse(message.content)._[1]?.toString();

  if (!url) {
    message.reply({
      embeds: [
        createEmbed({
          title: "URLを指定してください",
          color: "error"
        })
      ],
      flags: ["SuppressNotifications"]
    });
    return;
  }

  // VCに参加しているサーバーかどうか
  if (!GuildStates.has(message.guildId)) {
    message.reply({
      embeds: [
        createEmbed({
          title: "VCに接続していません",
          color: "error"
        })
      ],
      flags: ["SuppressNotifications"]
    });
    return;
  }

  const state = GuildStates.get(message.guildId);

  const msg = message.reply({
    embeds: [
      createEmbed({
        title: "検索中",
        description: url,
        color: "info"
      })
    ],
    flags: ["SuppressNotifications"]
  });

  // 曲検索
  const streamInfo = await getStreamInfo(url);

  if (streamInfo.length === 0) {
    msg.then((m) => m.delete());
    message.reply({
      embeds: [
        createEmbed({
          title: "検索中にエラーが発生しました",
          color: "error"
        })
      ]
    });
  } else {
    state.add(streamInfo);
    msg.then((m) => m.delete());
    message.reply({
      embeds: [
        createEmbed({
          title: `${streamInfo.length}曲をキューに追加しました`,
          color: "success"
        })
      ],
    });
  }
};
