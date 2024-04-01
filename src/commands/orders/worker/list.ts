import { db } from "../../../database/database";
import { generateOrderId, getAllActiveOrders, hasActiveOrder } from "../../../database/order";
import { client } from "../../../providers/client";
import { config, text } from "../../../providers/config";
import { mainGuild } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";
import pms from "pretty-ms";
import { OrderStatus } from "@prisma/client";

export const command = new Command("list", "Lists active orders.")
	.addPermission(permissions.employee)
	.setExecutor(async int => {
		const orders = await getAllActiveOrders();
		const txt = text.commands.list;
		int.reply(
			`>>> ${txt.title}\n${orders
				.map(x => `${format(txt.parts.id, x.id)}: \
${format(txt.parts.status, text.statuses[x.status] ?? x.status)}\
 - ${format(txt.parts.details, x.details)}\
 - ${format(txt.parts.time, `${pms(Date.now() - x.createdAt.getTime(), { verbose: true, unitCount: 1 })} ago`)}\
 ${x.status === OrderStatus.Unprepared ? "- **UNCLAIMED**" : x.status === OrderStatus.Preparing ? `- **Claimed by ${
		(x.claimer ? client.users.cache.get(x.claimer)?.tag : undefined) ?? "Unknown User"
	}**` : ""}
`)
				.join("\n") || `${txt.empty}`}`
		);
	});
