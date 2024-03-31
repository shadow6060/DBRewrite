import { REST } from "@discordjs/rest";
import { Client, Partials } from "discord.js";
import { config } from "./config";
import { join } from "path";
import { sync } from "fast-glob";
import { GatewayIntentBits } from "discord.js";

if (globalThis._$clientLoaded) throw new Error("The client was loaded twice. This should never happen.");
globalThis._$clientLoaded = true;

/**
 * The client instance.
 */
export const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		//GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
	partials: [Partials.User, Partials.Channel, Partials.GuildMember, Partials.Message]
});

client.on("ready", () => {
	console.log(`Logged in as ${client.user?.tag}!`);
	client.user?.setPresence({
		activities: [{ name: "We are online! Use slash cmds to order /order <description> & You get money through /work" }],
		status: "online", // "online", "idle", "dnd" (do not disturb), "invisible"
	});
});

/**
 * Instance of Discord's API for the bot, use `discord-api-types` for REST routes
 * @see https://discord.js.org/docs/packages/rest/main
 * @see https://discord-api-types.dev
 */
export const rest = new REST({ version: "9" }).setToken(config.token);

client.login(config.token);

const eventsFolder = join(__dirname, "../events/**/*.js").replace(/\\/g, "/");
sync(eventsFolder).forEach((x) => import(x) as unknown);
