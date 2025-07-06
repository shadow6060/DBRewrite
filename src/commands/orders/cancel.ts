import { OrderStatus } from "@prisma/client";
import { db } from "../../database/database";
import { mainChannels } from "../../providers/discord";
import { getUserActiveOrder } from "../../database/orders";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import type { TextChannel } from "discord.js";
import { MessageFlags } from "discord.js";

export const command = new Command("cancel", "Cancels your active order.")
	.setExecutor(async int => {
		const order = await getUserActiveOrder(int.user);
		if (!order) {
			await int.reply({ content: text.common.noActiveOrder, flags: MessageFlags.Ephemeral });
			return;
		}

		// Grace period logic: block canceling once it's too far along
		const nonCancelableStatuses: OrderStatus[] = [
			"Brewing",
			"PendingDelivery",
			"Delivered",
			"Cancelled",
		];

		if (nonCancelableStatuses.includes(order.status)) {
			await int.reply({
				content: "❌ Sorry, your order is already being processed and can no longer be cancelled.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await db.orders.update({
			where: { id: order.id },
			data: { status: OrderStatus.Cancelled },
		});

		await int.reply({ content: text.commands.cancel.success, flags: MessageFlags.Ephemeral });

		const breweryChannel = mainChannels.brewery as TextChannel;
		await breweryChannel.send(
			`An order with the id ${order.id} was cancelled!\n` +
			`Order desc: ${order.details}\n` +
			`Placed by ${int.user.tag}.`
		);
	});
