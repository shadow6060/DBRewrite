// client.ts
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
	],
	partials: [Partials.User, Partials.Channel, Partials.GuildMember, Partials.Message],
});

client.on("ready", async () => {
	console.log(`Logged in as ${client.user?.tag}!`);
	/*
		// Set Avatar
		const avatarPath = "C:/Somewhere/AnotherFolder/Test/DB/src/avatar";
		console.log("Checking contents of directory:", avatarPath);
	
		try {
			const files = await fs.readdir(avatarPath);
			console.log("Files in directory:", files);
	
			const avatarBuffer = await fs.readFile(join(avatarPath, "demon-slayer-running-zenitsu.gif"));
			await client.user?.setAvatar(avatarBuffer);
			console.log("Avatar set successfully!");
		} catch (error) {
			console.error("Error setting avatar:", error);
		
		}
	*/
	client.user?.setPresence({
		activities: [{ name: "We are online! Use slash cmds to order /order <description> & You get money through /work" }],
		status: "online",
	});
});

export const rest = new REST({ version: "9" }).setToken(config.token);

client.login(config.token);

const eventsFolder = join(__dirname, "../events/**/*.js").replace(/\\/g, "/");
sync(eventsFolder).forEach((x) => import(x) as unknown);
