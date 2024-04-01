import { OrderStatus } from "@prisma/client";
import { db } from "../../database/database";
import {
	generateOrderId,
	getClaimedOrder,
	getUserActiveOrder,
	hasActiveOrder,
	matchActiveOrder,
	matchOrderStatus,
	orderEmbedAsync,
} from "../../database/order";
import { getUserInfo, upsertUserInfo } from "../../database/userInfo";
import { client } from "../../providers/client";
import { config, constants, text } from "../../providers/config";
import { mainGuild } from "../../providers/discord";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
import { blacklist, createBlacklist } from "../../database/blacklist";

export const command = new Command("blacklist", "Blacklists a user, server, or channel.")
	.addPermission(permissions.moderator)
	.addOption("string", o => o.setName("id").setDescription("The ID of the user, server, or channel.").setRequired(true))
	.addOption("string", o => o.setName("reason").setDescription("The reason for the blacklist."))
	.addOption("boolean", o => o.setName("unblacklist").setDescription("Whether to unblacklist instead of blacklisting."))
	.setExecutor(async int => {
		const id = int.options.getString("id", true);
		if (int.options.getBoolean("unblacklist") === true) {
			if (!blacklist.has(id)) {
				await int.reply(text.commands.blacklist.remove.existing);
				return;
			}
			blacklist.delete(id);
			await db.blacklist.delete({ where: { id } });
			await int.reply(text.commands.blacklist.remove.success);
		} else {
			if (blacklist.has(id)) {
				await int.reply(text.commands.blacklist.existing);
				return;
			}
			await createBlacklist(id, int.user, int.options.getString("reason") ?? "No reason specified.");
			await int.reply(text.commands.blacklist.success);
		}
	});
