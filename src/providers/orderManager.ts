import { OrderStatus } from "@prisma/client";
import { db } from "../database/database";
import { client } from "../providers/client";
import { EmbedBuilder, Message } from "discord.js";

// Store sent messages to prevent duplicates
const orderMessages = new Map<string, Message>();

export const startOrderTimeoutChecks = () => {
	setInterval(async () => {
		//console.log("Checking for processing orders...");

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
	}, 60000);
};

// Function to handle order status transition
const handleOrderStatus = async (order: any) => {
	try {
		const user = await client.users.fetch(order.user);

		switch (order.status) {
			case OrderStatus.Preparing:
				await updateOrderStatusWithDelay(
					order,
					OrderStatus.Brewing,
					getRandomBrewTime(),
					user,
					`You have ordered **${order.details}** and your order will be brewed soon!`
				);
				break;

			case OrderStatus.Brewing:
				await updateOrderStatusWithDelay(
					order,
					OrderStatus.PendingDelivery,
					getRandomBrewTime(),
					user,
					`Your order **${order.details}** is packed up and ready for delivery! 📦`
				);
				break;

			case OrderStatus.PendingDelivery:
				await deliverOrder(order, user);
				break;
		}
	} catch (error) {
		console.error(`Error handling order #${order.id}:`, error);
	}
};

// Generate a random brewing time between 15 and 30 seconds
const getRandomBrewTime = () => {
	const brewTime = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
	//console.log(`Random brew time selected: ${brewTime} seconds`);
	return brewTime * 1000;
};

// Function to create an embedded receipt message
const createOrderEmbed = (order: any, statusMessage: string) => {
	const colors = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#1abc9c"];
	const randomColor = colors[Math.floor(Math.random() * colors.length)];

	return new EmbedBuilder()
		.setColor(randomColor as `#${string}`)
		.setTitle(`Order #${order.id}`)
		.setDescription(statusMessage)
		.setTimestamp();
};

// Prevent duplicate messages by editing instead of sending a new one
const updateOrderStatusWithDelay = async (
	order: any,
	newStatus: OrderStatus,
	delay: number,
	user: any,
	statusMessage: string
) => {
	try {
		await new Promise((resolve) => setTimeout(resolve, delay));

		await db.orders.update({
			where: { id: order.id },
			data: { status: newStatus },
		});

		const embed = createOrderEmbed(order, statusMessage);

		// Check if we already sent a message for this order
		if (orderMessages.has(order.id)) {
			const existingMessage = orderMessages.get(order.id);
			if (existingMessage) {
				await existingMessage.edit({ embeds: [embed] });
			}
		} else {
			const sentMessage = await user.send({ embeds: [embed] });
			orderMessages.set(order.id, sentMessage); // Store the sent message
		}
	} catch (error) {
		//console.error(`Error updating order #${order.id} status to ${newStatus}:`, error);
	}
};

// Function to deliver the order
const deliverOrder = async (order: any, user: any) => {
	try {
		// Fetch all drink images for this order type
		const drinkImages = await db.drinkImage.findMany({
			where: { drinkName: order.details }, // Assuming `details` stores the drink name
			select: { url: true },
		});

		// Pick a random image if available, otherwise use a placeholder
		const imageUrl =
			drinkImages.length > 0
				? drinkImages[Math.floor(Math.random() * drinkImages.length)].url
				: "https://via.placeholder.com/400";

		// Update order with selected image
		await db.orders.update({
			where: { id: order.id },
			data: { status: OrderStatus.Delivered, image: imageUrl },
		});

		const channel =
			client.channels.cache.get(order.channel) ??
			(await client.channels.fetch(order.channel).catch(() => null));

		if (!channel) {
			console.error(`Could not find channel ${order.channel} for order #${order.id}.`);
			return;
		}

		if ("send" in channel) {
			const embed = new EmbedBuilder()
				.setColor("#2ecc71")
				.setTitle("Order Delivered! 🎉")
				.setDescription(
					`Your order **#${order.id}** has been successfully delivered! Enjoy your drink! 🍹`
				)
				.setImage(imageUrl)
				.setTimestamp()
				.setFooter({ text: "Thanks for ordering with us!" });

			//console.log(`Sending delivery message for order #${order.id}...`);
			await channel.send({ embeds: [embed] });
			//console.log(`Delivery message sent for order #${order.id}.`);

			// Remove order from tracking to allow new messages in the future
			orderMessages.delete(order.id);
		} else {
			//console.error(`The channel for order #${order.id} does not support sending messages.`);
		}
	} catch (error) {
		console.error(`Error delivering order #${order.id}:`, error);
	}
};
