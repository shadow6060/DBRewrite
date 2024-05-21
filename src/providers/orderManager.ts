import { OrderStatus } from "@prisma/client";
import { db } from "../database/database";

export const startOrderTimeoutChecks = () => {
	setInterval(async () => {
		const brewFinished = await db.orders.findMany({
			where: {
				timeout: { lte: new Date() },
				status: OrderStatus.Brewing,
			},
		});

		if (brewFinished.length > 1) {
			await Promise.all(brewFinished.map(async (order) => {
				// Update the status to PendingDelivery
				await db.orders.update({
					where: { id: order.id },
					data: {
						status: OrderStatus.PendingDelivery,
						timeout: null, // Clear the timeout
					},
				});
			}));
		}
	}, 1000); // Check every second
};
