import { Client, GatewayIntentBits } from "discord.js";
import parser from "yargs-parser";
import { joinHandler } from "./handlers/join.ts";
import { leaveHandler } from "./handlers/leave.ts";
import { playHandler } from "./handlers/play.ts";
import { listHandler } from "./handlers/list.ts";
import { skipHandler } from "./handlers/skip.ts";

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
      break;
    }
    default: {
      break;
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
