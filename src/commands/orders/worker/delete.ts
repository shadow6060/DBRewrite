import { CafeStatus, OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { matchActiveOrder } from "../../../database/orders";
import { client } from "../../../providers/client";
import { text } from "../../../providers/config";
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

		const user = await client.users.fetch(order.user);
		if (!user) {
			// User not found
			await int.reply(text.commands.delete.userNotFound);
			return;
		}

		try {
			await user.send(format(text.commands.delete.dm, order.details, reason));
		} catch (error) {
			// Failed to send DM to the user
			await int.reply(text.commands.delete.dmFailed);
			return;
		}

		await db.orders.update({
			where: { id: order.id },
			data: { claimer: int.user.id, status: OrderStatus.Deleted, deleteReason: reason },
		});

		await int.reply(text.commands.delete.success);
	});
