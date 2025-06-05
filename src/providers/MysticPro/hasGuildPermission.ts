import type { GuildMember } from "discord.js";
import { getserverConfig } from "../../database/serverConfig"; // adjust the import path as needed

export async function hasGuildPermission(
	member: GuildMember,
	type: "admin" | "moderator"
): Promise<boolean> {
	const config = await getserverConfig(member.guild.id);
	if (!config) return false;

	if (type === "admin" && config.adminRoles) {
		return config.adminRoles.some(roleId => member.roles.cache.has(roleId));
	}
	if (type === "moderator" && config.moderatorRoles) {
		return config.moderatorRoles.some(roleId => member.roles.cache.has(roleId));
	}
	return false;
}
