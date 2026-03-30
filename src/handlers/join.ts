import type { Message, OmitPartialGroupDMChannel } from "discord.js";
import { createEmbed } from "../lib/createEmbed.ts";
import { joinVoiceChannel } from "@discordjs/voice";
import { GuildStates, State } from "../state/state.ts";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";
import { BASE_URL } from "../main.ts";

export const joinHandler = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const voiceChannel = message.member?.voice.channel;

  if (!voiceChannel) {
    message.reply({
      embeds: [
        createEmbed({
          title: "VCに接続してからコマンドを実行してください",
          color: "error"
        })
      ],
      ...DEFAULT_MESSAGE_OPTIONS
    });
    return;
  }

  const conn = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true
  });

  GuildStates.set(message.guildId, new State(conn, message.channelId, message.guildId));

  message.reply({
    embeds: [
      createEmbed({
        title: `${voiceChannel.name}に接続しました`,
        description: `${BASE_URL}/queue/?id=${message.guildId}&token=${GuildStates.get(message.guildId).token}`,
        color: "success"
      })
    ],
    ...DEFAULT_MESSAGE_OPTIONS
  });
};
