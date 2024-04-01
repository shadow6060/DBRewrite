import { OrderStatus } from "@prisma/client";
import { db } from "../database/database";
import { format } from "../utils/string";
import { text } from "./config";
import { mainChannels } from "./discord";

export const startOrderTimeoutChecks = () => {
	setInterval(async () => {
		const brewFinished = await db.order.findMany({ where: { timeout: { lte: new Date() }, status: OrderStatus.Brewing } });
		await db.order.updateMany({
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
