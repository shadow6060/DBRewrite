import type { Guild, Role, TextBasedChannel } from "discord.js";
import { notInitialized, typedEntries, typedFromEntries, isNotInitialized } from "../utils/utils";
import { client } from "./client";
import { config } from "./config";

/**
 * The guild's main guild.
 */
export let mainGuild: Guild = notInitialized<Guild>("mainGuild");

/** Updates the main guild. */
export const setMainGuild = (guild: Guild) => (mainGuild = guild);

/** The guild's main emojis. */
export const mainEmojis: Record<string, string> = {};

/** The guild's main channels. */
export let mainChannels: Record<string, TextBasedChannel> = {}; // Initialize as an empty object

/** The guild's main roles. */
export let mainRoles: Record<keyof typeof config["roles"], Role> = notInitialized("mainRoles");

/** Updates the main roles. */
export const setMainRoles = (roles: typeof mainRoles) => (mainRoles = roles);

// Initialization section
client.once("ready", async () => {
	// Initialize main guild
	const guild = client.guilds.cache.get(config.mainServer);
	if (!guild) {
		console.error(`Guild with ID ${config.mainServer} not found`);
		process.exit(1);
	}
	setMainGuild(guild);

	// Initialize main channels
	const channels: Record<string, TextBasedChannel> = {};
	for (const [key, channelId] of Object.entries(config.channels)) {
		const channel = client.channels.cache.get(channelId);
		if (!channel) {
			console.error(`Channel with ID ${channelId} not found in guild ${guild.id}`);
			process.exit(1);
		}
		channels[key] = channel as TextBasedChannel; // Cast to TextBasedChannel
	}
	mainChannels = channels; // Assign initialized channels

	// Initialize main roles
	const roles: Record<keyof typeof config["roles"], Role> = {} as Record<keyof typeof config["roles"], Role>;
	for (const [key, roleId] of Object.entries(config.roles)) {
		const role = guild.roles.cache.get(roleId);
		if (!role) {
			console.error(`Role with ID ${roleId} not found in guild ${guild.id}`);
			process.exit(1);
		}
		roles[key as keyof typeof config["roles"]] = role;
	}
	setMainRoles(roles);

	console.log("Bot is ready to go!");
});
export { isNotInitialized };
