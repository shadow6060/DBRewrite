import { text } from "../../../providers/config";
import { mainGuild, mainRoles } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { ExtendedCommand } from "../../../structures/extendedCommand";

export const command = new ExtendedCommand(
	{ name: "duty", description: "Toggles your on-duty status.", local: true }
)
	.addPermission(permissions.employee)
	.setExecutor(async int => {
		if (int.guildId !== mainGuild.id) {
			await int.reply(text.common.mainGuildOnly);
			return;
		}
		const has = int.member.roles.cache.has(mainRoles.duty.id);
		const hass = int.member.roles.cache.has(mainRoles.dutyd.id);
		if (has) await int.member.roles.remove(mainRoles.duty);
		else await int.member.roles.add(mainRoles.duty);
		if (hass) await int.member.roles.remove(mainRoles.dutyd);
		else await int.member.roles.add(mainRoles.dutyd);
		await int.reply(has ? text.commands.duty.disabled : text.commands.duty.enabled);
	});