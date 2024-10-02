import { OrderStatus } from "@prisma/client";
import { db } from "../database/database";
import { client } from "../providers/client";
import { text } from "../providers/config";
// Define the text object for messages
export const startOrderTimeoutChecks = () => {
	setInterval(async () => {
		// Fetch orders that are in the process (not yet Delivered or Cancelled)
		const processingOrders = await db.orders.findMany({
			where: {
				status: {
					in: [
						OrderStatus.Preparing,
						OrderStatus.Brewing,
						OrderStatus.PendingDelivery,
					],
				},
			},
		});

		for (const order of processingOrders) {
			await handleOrderStatus(order);
		}
	}, 60000); // Check every minute instead of every second
};

// Function to handle order status transition
const handleOrderStatus = async (order: any) => {
	const user = await client.users.fetch(order.user);

	switch (order.status) {
		case OrderStatus.Preparing:
			// Move to Brewing after 10 seconds
			await updateOrderStatusWithDelay(order.id, OrderStatus.Brewing, 10000, user, `Your order ${order.id} is now brewing!`);
			break;

		case OrderStatus.Brewing:
			// Move to PendingDelivery after 10 seconds
			await updateOrderStatusWithDelay(order.id, OrderStatus.PendingDelivery, 10000, user, `Your order ${order.id} is packed up and ready for delivery!`);
			break;

		case OrderStatus.PendingDelivery:
			// Directly deliver the order
			await deliverOrder(order);
			break;

		default:
			break;
	}
};

// Function to deliver the order
const deliverOrder = async (order: any) => {
	// Update order status to Delivered
	await db.orders.update({
		where: { id: order.id },
		data: { status: OrderStatus.Delivered },
	});

	const channel = client.channels.cache.get(order.channel) ?? await client.channels.fetch(order.channel).catch(() => null);

	if (!channel) {
		console.error("Could not find the channel for order delivery.");
		return;
	}

	// Type guard to ensure channel can send messages
	if ("send" in channel) {
		// Prepare the message using the `delivered` template
		const message = text.commands.deliver.delivered
			.replace("{orderId}", order.id)
			.replace("{image}", order.image || "No image available."); // Fallback if there's no image

		// Send the order details and image to the user's channel
		await channel.send(message);
	} else {
		console.error("The channel does not support sending messages.");
	}
};

// Utility function to update order status with a delay and send a single message
const updateOrderStatusWithDelay = async (orderId: string, newStatus: OrderStatus, delay: number, user: any, message: string) => {
	// Check if the order is already at the next status to avoid duplicate updates
	const order = await db.orders.findUnique({ where: { id: orderId } });

	if (order?.status !== newStatus) {
		await new Promise((resolve) => setTimeout(resolve, delay)); // Wait for the specified delay

		await db.orders.update({
			where: { id: orderId },
			data: { status: newStatus },
		});

		// Send the status update message only once after updating the status
		await user.send(message);
	}
};
