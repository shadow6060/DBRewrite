import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import {
	generateOrderId,
	getClaimedOrder,
	getOrder,
	hasActiveOrder,
	matchActiveOrder,
	matchOrderStatus,
	orderEmbedAsync,
} from "../../../database/order";
import { client } from "../../../providers/client";
import { config, text } from "../../../providers/config";
import { mainGuild, mainRoles } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";

export const command = new Command("duty", "Toggles your on-duty status.")
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
