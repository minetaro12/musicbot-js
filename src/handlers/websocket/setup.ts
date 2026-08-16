import { Server } from "socket.io";
import { GuildStates } from "../../state/state.ts";

type SocketAuth = {
  token: string | undefined;
  guildId: string | undefined;
};

const PROGRESS_UPDATE_INTERVAL_MS = 1000;

export const setupWebSocketHandlers = (io: Server) => {
  io.on("connection", (socket) => {
    // ここでクライアントの認証をする
    const { token, guildId } = socket.handshake.auth as SocketAuth;

    // トークンとギルドIDがない場合は切断
    if (!token || !guildId) {
      socket.emit("error", "認証に失敗しました。トークンが無効です。");
      socket.disconnect();
      return;
    }

    // ギルドの状態を取得してトークンを検証
    const state = GuildStates.get(guildId);
    if (!state || state?.token !== token) {
      socket.emit("error", "認証に失敗しました。トークンが無効です。");
      socket.disconnect();
      return;
    }

    // 認証成功したクライアントを特定のルームに参加させる
    socket.join(guildId);

    // 現在再生中の曲、キュー、正確な再生位置を送信
    socket.emit("stateUpdate", state.getStateUpdate());

    const progressUpdateInterval = setInterval(() => {
      const currentState = GuildStates.get(guildId);

      // Stateが破棄・置換された場合は、古いトークンで更新を送り続けない
      if (!currentState || currentState.token !== token) {
        socket.disconnect();
        return;
      }

      socket.emit("playbackProgress", currentState.getPlaybackProgress());
    }, PROGRESS_UPDATE_INTERVAL_MS);

    socket.once("disconnect", () => {
      clearInterval(progressUpdateInterval);
    });

  });
};
