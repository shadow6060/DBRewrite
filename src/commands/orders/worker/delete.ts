import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { generateOrderId, getClaimedOrder, hasActiveOrder, matchActiveOrder, matchOrderStatus } from "../../../database/order";
import { client } from "../../../providers/client";
import { config, text } from "../../../providers/config";
import { mainGuild } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";

export const command = new Command("delete", "Deletes an order.")
	.addPermission(permissions.employee)
	.addOption("string", o => o.setRequired(true).setName("order").setDescription("The order to delete."))
	.addOption("string", o => o.setRequired(true).setName("reason").setDescription("The reason for the deletion."))
	.setExecutor(async int => {
		const match = int.options.getString("order", true);
		const reason = int.options.getString("reason", true);
		const order = await matchActiveOrder(match);
		if (order === null) {
			await int.reply(text.common.invalidOrderId);
			return;
		}
		await (await client.users.fetch(order.user)).send(format(text.commands.delete.dm, order.details, reason));
		await db.order.update({
			where: { id: order.id },
			data: { claimer: int.user.id, status: OrderStatus.Deleted, deleteReason: reason },
		});
		await int.reply(text.commands.delete.success);
	});
