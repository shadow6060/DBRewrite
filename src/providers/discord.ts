import type { Guild, Role, TextBasedChannel } from "discord.js";
import { notInitialized, typedEntries, typedFromEntries } from "../utils/utils";
import { client } from "./client";
import { config } from "./config";

/**
 * The guild's main guild.
 */
export let mainGuild = client.guilds.cache.get(config.mainServer) ?? notInitialized("mainGuild");

/** Updates the main guild. */
export const setMainGuild = (guild: Guild) => (mainGuild = guild);

/** The guild's main emojis. */
export const mainEmojis: Record<string, string> = {};

/** The guild's main channels. */
export const mainChannels = typedFromEntries(
	typedEntries(config.channels).map(
		x => [x[0], (client.channels.cache.get(x[1]) ?? notInitialized(`mainChannels.${x[0]}`)) as TextBasedChannel] as const
	)
);

/** The guild's main roles. */
export let mainRoles: Record<keyof typeof config["roles"], Role> = notInitialized("mainRoles");

/** Updates the main roles. */
export const setMainRoles = (roles: typeof mainRoles) => (mainRoles = roles);