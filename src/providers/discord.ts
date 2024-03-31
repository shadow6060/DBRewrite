import type { Guild, Role, TextBasedChannel } from "discord.js";
import { notInitialized, typedEntries, typedFromEntries } from "../utils/utils";
import { client } from "./client";
import { config } from "./config";

export let mainGuild = client.guilds.cache.get(config.mainServer) ?? notInitialized("mainGuild");

export const setMainGuild = (guild: Guild) => (mainGuild = guild);

export const mainEmojis: Record<string, string> = {};
export const mainChannels = typedFromEntries(
	typedEntries(config.channels).map(
		x => [x[0], (client.channels.cache.get(x[1]) ?? notInitialized(`mainChannels.${x[0]}`)) as TextBasedChannel] as const
	)
);
export let mainRoles: Record<keyof typeof config["roles"], Role> = notInitialized("mainRoles");

export const setMainRoles = (roles: typeof mainRoles) => (mainRoles = roles);