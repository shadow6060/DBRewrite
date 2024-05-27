/* eslint-disable indent */
import { getAllActiveOrders } from "../../../database/orders";
import { client } from "../../../providers/client";
import { text } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";
import pms from "pretty-ms";
import { CafeStatus, OrderStatus } from "@prisma/client";
import { ExtendedCommand } from "../../../structures/extendedCommand";

// Define the command options
interface CommandOptions {
	name: string; // Ensure that 'name' is explicitly defined as a string
	description?: string;
	// Other properties as needed
}

// Create the command using ExtendedCommand class
export const command = new ExtendedCommand({ name: "list", description: "Lists active orders.", local: true })
	.addPermission(permissions.employee)
	.setExecutor(async int => {
		const orders = await getAllActiveOrders();
		const txt = text.commands.list;
		const orderCount = orders.length;

		await int.reply(
			`>>> ${txt.title}\nTotal Orders: ${orderCount}\n${orders
				.map(x => `${format(txt.parts.id, x.id)}: \
${format(txt.parts.status, text.statuses[x.status] ?? x.status)}\
 - ${format(txt.parts.details, x.details)}\
 - ${format(txt.parts.time, `${pms(Date.now() - x.createdAt.getTime(), { verbose: true, unitCount: 1 })} ago`)}\
 ${x.status === OrderStatus.Unprepared ? "- **UNCLAIMED**" : x.status === OrderStatus.Preparing ? `- **Claimed by ${(x.claimer ? client.users.cache.get(x.claimer)?.username : undefined) ?? "Unknown User"
						}**` : ""}
`)
				.join("\n") || `${txt.empty}`}`
		);
	});
