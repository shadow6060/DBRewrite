import { OrderStatus } from "@prisma/client";
import { db } from "../database/database";
import { format2 } from "../utils/string";
import { text } from "./config";
import { mainRoles } from "./discord";

export const startOrderTimeoutChecks = () => {
	setInterval(async () => {
		const brewFinished = await db.orders.findMany({
			where: {
				timeout: { lte: new Date() },
				status: OrderStatus.Brewing,
			},
		});

		if (brewFinished.length > 0) {
			await db.orders.updateMany({
				where: { id: { in: brewFinished.map(x => x.id) } },
				data: {
					timeout: null,
					status: OrderStatus.PendingDelivery,
				},
			});
		}
	}, 3000);
};
