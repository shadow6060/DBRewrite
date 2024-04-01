import { OrderStatus } from "@prisma/client";
import { db } from "../../database/database";
import { mainChannels } from "../../providers/discord";
import { generateOrderId, getUserActiveOrder, hasActiveOrder } from "../../database/order";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("cancel", "Cancels your active order.")
	.setExecutor(async int => {
		const order = await getUserActiveOrder(int.user);
		if (!order) {
			await int.reply(text.common.noActiveOrder);
			return;
		}
		await db.order.update({
			where: {
				id: order.id
			},
			data: {
				status: OrderStatus.Cancelled
			},
		});
		await int.reply(text.commands.cancel.success);
		mainChannels.brewery.send(`An order with the id ${order.id}' was cancelled!\n Order desc: ${order.details}\nPlaced by ${int.user}.`);
	});