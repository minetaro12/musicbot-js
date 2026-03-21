import type { Message, OmitPartialGroupDMChannel } from "discord.js";
import { createEmbed } from "../lib/createEmbed.ts";
import { GuildStates, State } from "../state/state.ts";

export const leaveHandler = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const guildId = message.guildId;

  if (!guildId) {
    message.reply({
      embeds: [
        createEmbed({
          title: "サーバー内でコマンドを実行してください",
          color: "error"
        })
      ],
      flags: ["SuppressNotifications"]
    });
    return;
  }

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

  GuildStates.get(guildId)?.connection.disconnect();
  GuildStates.delete(guildId);

  message.reply({
    embeds: [
      createEmbed({
        title: "切断しました",
        color: "success"
      })
    ],
    flags: ["SuppressNotifications"]
  });

};
