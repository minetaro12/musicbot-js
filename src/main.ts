import { ActivityType, Client, GatewayIntentBits } from "discord.js";
import express from "express";
import parser from "yargs-parser";
import { joinHandler } from "./handlers/join.ts";
import { leaveHandler } from "./handlers/leave.ts";
import { playHandler } from "./handlers/play.ts";
import { listHandler } from "./handlers/list.ts";
import { skipHandler } from "./handlers/skip.ts";
import { helpHandler } from "./handlers/help.ts";
import indexRouter from "./routes/index.ts";
import http from "http";
import { Server } from "socket.io";
import { setupWebSocketHandlers } from "./handlers/websocket/setup.ts";
import { GuildStates } from "./state/state.ts";

// .env読み込み
process.loadEnvFile("./.env");

export const client = new Client({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.on("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  const updateStatus = () => {
    client.user?.setActivity({
      name: `!help || ping: ${client.ws.ping}ms`,
      type: ActivityType.Custom
    });
  };

  updateStatus();

  // 30秒ごとにステータスを更新
  setInterval(updateStatus, 30000);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  // 先頭が ! でないメッセージは無視
  if (!message.content.startsWith("!")) return;

  const args = parser(message.content);

  switch (args._[0]?.toString().split("!")[1]) {
    case "join": {
      joinHandler(message);
      break;
    }
    case "leave": {
      leaveHandler(message);
      break;
    }
    case "play": {
      playHandler(message);
      break;
    }
    case "list": {
      listHandler(message);
      break;
    }
    case "skip": {
      skipHandler(message);
      break;
    }
    case "help": {
      helpHandler(message);
      break;
    }
    default: {
      break;
    }
  }
});

// タイムアウト用
client.on("voiceStateUpdate", (oldState, newState) => {
  const guildId = newState.guild.id;
  const voiceChannelId = newState.channelId || oldState.channelId;

  if (!voiceChannelId) return;

  const state = GuildStates.get(guildId);
  if (!state) return;

  const voiceChannel = client.channels.cache.get(voiceChannelId);
  if (!voiceChannel || !voiceChannel.isVoiceBased()) return;

  const memberCount = voiceChannel.members.filter(member => !member.user.bot).size;

  if (memberCount === 0) {
    state.startEmptyChannelTimer();
  } else {
    state.cancelEmptyChannelTimer();
  }
});

// expressサーバーのセットアップ
const app = express();
const PORT = process.env.PORT || 3000;
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use("/", indexRouter);
app.use(express.static("public"));

// HTTPサーバーとSocket.IOのセットアップ
const server = http.createServer(app);
export const io = new Server(server);

// Socket.IOハンドラーをセットアップ
setupWebSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Web UI is running on ${BASE_URL}`);
});

client.login(process.env.DISCORD_TOKEN);
