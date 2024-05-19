import { CafeStatus } from "@prisma/client";
import { db } from "../database/database";
import { format } from "../utils/string";
import { text } from "./config";
import { mainChannels, mainRoles } from "./discord";
import { OrderStatus } from "../database/orders";

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
					text.commands.brew.ready2,
					{
						dutyd: mainRoles.dutyd.toString(), // Placeholder for {dutyd}
						id: brewFinished.map(x => `\`${x.id}\``).join(", "), // Placeholder for {id}
					}
				)
			);
		}
	}, 5000);
};