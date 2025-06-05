import type { GuildMember } from "discord.js";
import { getserverConfig } from "../../database/serverConfig";
import { config } from "../../providers/config"; // Your existing config import

export async function hasAdminAccess(member: GuildMember): Promise<boolean> {
	// Bot owner override
	if (config.developers.includes(member.id)) return true; // correct, check if ID is in the array

	// Discord's built-in Administrator permission check
	if (member.permissions.has("Administrator")) return true;

	// Check server config admin roles
	const serverConfig = await getserverConfig(member.guild.id);
	if (serverConfig?.adminRoles) {
		if (serverConfig.adminRoles.some(roleId => member.roles.cache.has(roleId))) return true;
	}

	return false;
}
