import type { Message, OmitPartialGroupDMChannel } from "discord.js";
import { GuildStates } from "../state/state.ts";
import { createEmbed } from "../lib/createEmbed.ts";

const BAR_LENGTH = 20;

export const listHandler = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const guildId = message.guildId;
  let num = parseInt(message.content.split(" ")[1]) || 1;

  const ITEM_PER_PAGE = 10;

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

  let description = `🎵 現在再生中: ${state.nowPlaying?.title || "なし"}\n\n`;

  // プログレスバーの計算
  const progress = state.getPlaybackProgress();
  const progressBar = "▬".repeat(Math.floor(progress.percentage / 100 * BAR_LENGTH)) + "🔘" + "▬".repeat(BAR_LENGTH - Math.floor(progress.percentage / 100 * BAR_LENGTH));
  description += `${progressBar} ${formatTime(progress.current)} / ${formatTime(progress.total)}\n\n`;

  if (state.queue.length === 0) {
    description += "再生リストは空です";
  } else {
    // ページ数計算
    const totalPages = Math.ceil(state.queue.length / ITEM_PER_PAGE);

    if (num < 1) num = 1;
    if (num > totalPages) num = totalPages;

    const startIndex = (num - 1) * ITEM_PER_PAGE;
    const endIndex = startIndex + ITEM_PER_PAGE;

    description += `🗒️ 再生待ち (${num}/${totalPages}):\n`;
    state.queue.slice(startIndex, endIndex).forEach((item, index) => {
      description += `${startIndex + index + 1}. ${item.title} (${formatTime(item.duration)})\n`;
    });

    description += `\n(全${state.queue.length}曲)\n`;
    description += "ページを切り替えるには`!list <ページ番号>`を使用してください";
  }

  message.reply({
    embeds: [
      createEmbed({
        title: "再生リスト",
        description: description,
        color: "info"
      })
    ],
    flags: ["SuppressNotifications"]
  });
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
