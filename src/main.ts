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
import apiRouter from "./routes/api.ts";

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

// expressサーバーのセットアップ
const app = express();
const PORT = process.env.PORT || 3000;
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use("/", indexRouter);
app.use(express.static("public"));
app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Web UI is running on ${BASE_URL}`);
});

client.login(process.env.DISCORD_TOKEN);
