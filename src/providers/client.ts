import { REST } from "@discordjs/rest";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { config } from "./config";
import { join } from "path";
import { sync } from "fast-glob";
import fs from "fs/promises";

if (globalThis._$clientLoaded) throw new Error("The client was loaded twice. This should never happen.");
globalThis._$clientLoaded = true;

export const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.User, Partials.Channel, Partials.GuildMember, Partials.Message],
});

client.on("ready", async () => {
	console.log(`Logged in as ${client.user?.tag}!`);

	// Set the starting activity to "Starting up..."
	client.user?.setPresence({
		activities: [{ name: "Starting up..." }],
	});

	// Delay for 3 seconds before updating status to online
	setTimeout(() => {
		// Set the activity to "We are online!"
		client.user?.setPresence({
			activities: [{ name: "We are online! Use slash cmds to order /order <description> & You get money through /work" }],
			status: "online",
		});
	}, 3000); // 3000 milliseconds = 3 seconds
});

export const rest = new REST({ version: "9" }).setToken(config.token);

client.login(config.token);

const eventsFolder = join(__dirname, "../events/**/*.js").replace(/\\/g, "/");
sync(eventsFolder).forEach((x) => import(x) as unknown);
