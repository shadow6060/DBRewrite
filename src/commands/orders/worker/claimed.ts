import { getClaimedOrder, orderEmbedAsync } from "../../../database/orders";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import type { CommandInteraction } from "discord.js";
import { ExtendedCommand } from "../../../structures/extendedCommand";
export const command = new ExtendedCommand({ name: "claimed", description: "checks your claimed order.", local: true })
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