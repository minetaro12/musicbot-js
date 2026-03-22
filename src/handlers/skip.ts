import type { OmitPartialGroupDMChannel, Message, TextChannel } from "discord.js";
import { GuildStates } from "../state/state.ts";
import { createEmbed } from "../lib/createEmbed.ts";

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
      flags: ["SuppressNotifications"]
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
    flags: ["SuppressNotifications"]
  });
};
