import { getClaimedOrder, orderEmbedAsync } from "../../../database/orders";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import type { CommandInteraction } from "discord.js";
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