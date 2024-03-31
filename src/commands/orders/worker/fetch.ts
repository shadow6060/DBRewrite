import { getOrder, matchActiveOrder, orderEmbedAsync } from "../../../database/orders";
import { client } from "../../../providers/client";
import { text } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";

export const command = new Command(
	"fetch",
	"Fetches the status of an order."
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
		const match = int.options.get("order")?.value;
		const inactive = int.options.get("inactive")?.value;
		const order = inactive ? await getOrder(match) : await matchActiveOrder(match);
		if (!order) {
			await int.reply(text.common.invalidOrderId);
			return;
		} else {
			await int.reply({ embeds: [await orderEmbedAsync(order, client)] });
		}
	});
