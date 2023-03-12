import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { generateOrderId, getClaimedOrder, hasActiveOrder, matchActiveOrder, matchOrderStatus, orderEmbedAsync } from "../../../database/order";
import { client } from "../../../providers/client";
import { config, text } from "../../../providers/config";
import { mainGuild } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";
import type { CommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
export const command = new Command("claimed", "Checks your claimed order.")
	.addPermission(permissions.employee)
	.setExecutor(async (int: CommandInteraction) => {
		const order = await getClaimedOrder(int.user);
		if (!order) {
			await int.reply("You have not claimed an order.");
			return;
		}

		const embed = await orderEmbedAsync(order, int.client);

		await int.reply({
			embeds: [embed]
		});
	});