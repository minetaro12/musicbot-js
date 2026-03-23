import type { OmitPartialGroupDMChannel, Message, TextChannel } from "discord.js";
import { GuildStates } from "../state/state.ts";
import { createEmbed } from "../lib/createEmbed.ts";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";

export const skipHandler = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const guildId = message.guildId;
  const num = parseInt(message.content.split(" ")[1]) || 1;

  // 接続中かどうか確かめる
  if (!GuildStates.has(guildId)) {
    message.reply({
      embeds: [
        createEmbed({
          title: "VCに接続していません",
          color: "error"
        })
      ],
      ...DEFAULT_MESSAGE_OPTIONS
    });
    return;
  }

  const state = GuildStates.get(guildId);
  state.skip(num);

  message.reply({
    embeds: [
      createEmbed({
        title: `${num}曲スキップしました`,
        color: "info"
      })
    ],
    ...DEFAULT_MESSAGE_OPTIONS
  });
};
