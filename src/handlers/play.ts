import type { Message, OmitPartialGroupDMChannel } from "discord.js";
import parse from "yargs-parser";
import { createEmbed } from "../lib/createEmbed.ts";
import { GuildStates } from "../state/state.ts";
import { getStreamInfo } from "../lib/getStreamInfo.ts";
import { joinHandler } from "./join.ts";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";

export const playHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  let url = parse(message.content)._[1]?.toString();

  if (!url) {
    message.reply({
      embeds: [
        createEmbed({
          title: "URLを指定してください",
          color: "error"
        })
      ],
      ...DEFAULT_MESSAGE_OPTIONS
    });
    return;
  }

  // VCに接続していない場合は参加する
  if (!GuildStates.has(message.guildId)) {
    joinHandler(message);
  }

  // URLがhttp、httpsで始まらない場合は検索ワードとみなす
  // 50曲を検索するためにytsearch50:を付与する
  url.startsWith("http://") || url.startsWith("https://") || (url = `ytsearch50:${url}`);

  const state = GuildStates.get(message.guildId);

  const msg = message.reply({
    embeds: [
      createEmbed({
        title: "検索中",
        description: url,
        color: "info"
      })
    ],
    ...DEFAULT_MESSAGE_OPTIONS
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
      ],
      ...DEFAULT_MESSAGE_OPTIONS
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
      ...DEFAULT_MESSAGE_OPTIONS
    });
  }
};
