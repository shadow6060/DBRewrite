import { OrderStatus } from "@prisma/client";
import { db } from "../../database/database";
import { generateOrderId, getClaimedOrder, getUserActiveOrder, hasActiveOrder, matchActiveOrder, matchOrderStatus, orderEmbedAsync } from "../../database/order";
import { client } from "../../providers/client";
import { config, text } from "../../providers/config";
import { mainGuild } from "../../providers/discord";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import { EmbedBuilder } from "discord.js";

export const command = new Command("status", "Checks the status of your current order.")
	.addPermission(permissions.employee)
	.setExecutor(async int => {
		const order = await getUserActiveOrder(int.user);
		if (!order) {
			await int.reply(text.common.noActiveOrder);
			return;
		}
		const embed = new EmbedBuilder()
			.setColor("#0099ff")
			.setTitle("Order Status")
			.setDescription(`The status of your order is ${order.status}.`);
		await int.reply({ embeds: [embed] });
	});
