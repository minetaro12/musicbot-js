import type { Message, OmitPartialGroupDMChannel } from "discord.js";

export const helpHandler = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const helpMessage = `\`\`\`!join: ボイスチャンネルに参加します。
!leave: ボイスチャンネルから退出します。
!play <URL>: 指定したURLの音楽を再生します。
!list <ページ番号>: 再生キューの一覧を表示します。
!skip <スキップ数>: 現在再生中の曲をスキップします。
!help: このヘルプメッセージを表示します。
\`\`\``;

  message.reply({
    content: helpMessage,
    flags: ["SuppressNotifications"]
  });
};
