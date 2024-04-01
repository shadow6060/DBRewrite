import { db } from "../database/database";
import { format } from "../utils/string";
import { text } from "./config";
import { mainChannels } from "./discord";
import { OrderStatus } from "../database/orders";

/**
 * Checks for orders that have finished brewing every 5s, updates status to `PendingDelivery`, and sends a message to the delivery channel.
 */
export const startOrderTimeoutChecks = () => {
	setInterval(async () => {
		const brewFinished = await db.orders.findMany({ where: { timeout: { lte: new Date() }, status: OrderStatus.Brewing } });
		await db.orders.updateMany({
			where: { id: { in: brewFinished.map(x => x.id) } },
			data: { timeout: null, status: OrderStatus.PendingDelivery },
		});
		if (brewFinished.length) {
			const plural = brewFinished.length > 1;
			await mainChannels.delivery.send(
				format(
					text.commands.brew.ready,
					plural ? "s" : "",
					brewFinished.map(x => `\`${x.id}\``).join(", "),
					plural ? "have" : "has",
					plural ? "are" : "is"
				)
			);
		}
	}, 5000);
};
