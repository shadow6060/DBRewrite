import { getOrder, matchActiveOrder, orderEmbedAsync } from "../../../database/orders";
import { client } from "../../../providers/client";
import { text } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { ExtendedCommand } from "../../../structures/extendedCommand";

export const command = new ExtendedCommand(
	{ name: "fetch", description: "Fetches the status of an order.", local: true }
)
	.addPermission(permissions.employee)
	.addOption("string", (o) => o
		.setRequired(true)
		.setName("order")
		.setDescription(
			"The order to fetch. Requires the entire ID when checking inactive orders."
		)
	)
	.addOption("boolean", (o) =>
		o.setName("inactive").setDescription("Include inactive orders too.")
	)
	.setExecutor(async (int) => {
		const match = int.options.get("order", true).value as string;
		const inactive = int.options.get("inactive")?.value as boolean;
		const order = inactive ? await getOrder(match) : await matchActiveOrder(match);
		if (!order) {
			await int.reply(text.common.invalidOrderId);
			return;
		} else {
			await int.reply({ embeds: [await orderEmbedAsync(order, client)] });
		}
	});
