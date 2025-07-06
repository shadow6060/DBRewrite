import { OrderStatus } from "@prisma/client";
/**
 * Determines if an order is eligible for cancellation based on its status and age.
 * @param order The order object from the database.
 * @returns `true` if the order can be cancelled, otherwise `false`.
 */
export function canCancelOrder(order: {
	status: OrderStatus;
	createdAt: Date;
}): boolean {
	const cancellableStatuses: OrderStatus[] = [
		OrderStatus.Unprepared,
		OrderStatus.Preparing,
	];

	if (cancellableStatuses.includes(order.status)) return true;

	// Optional grace period logic for Brewing status
	if (order.status === OrderStatus.Brewing) {
		const BREW_CANCEL_WINDOW_MS = 20 * 1000; // 20 seconds
		const created = new Date(order.createdAt).getTime();
		const now = Date.now();

		if (now - created <= BREW_CANCEL_WINDOW_MS) return true;
	}

	return false;
}

const nonCancelableStatuses: OrderStatus[] = [
	"Brewing",
	"PendingDelivery",
	"Delivered",
	"Cancelled",
];

export function isOrderNonCancelable(status: OrderStatus): boolean {
	return nonCancelableStatuses.includes(status);
}