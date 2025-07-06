import { OrderStatus } from "@prisma/client";
import { db } from "../database/database";
import { client } from "../providers/client";
import { EmbedBuilder, Message } from "discord.js";
import { isManualMode } from "../utils/MysticUtils/settings";

// Store sent messages to prevent duplicates
const orderMessages = new Map<string, Message>();

export const startOrderTimeoutChecks = () => {
	setInterval(async () => {
		const manualMode = await isManualMode();

		// 🛑 If Manual Mode is ON, skip automated processing
		if (manualMode) {
			return;
		}

		// 🔄 Automated processing
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
	}, 60000); // Every minute
};

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
					`Your order **${order.details}** is being prepared and will be brewed soon!`
				);
				break;

			case OrderStatus.Brewing:
				await updateOrderStatusWithDelay(
					order,
					OrderStatus.PendingDelivery,
					getRandomBrewTime(),
					user,
					`Your order **${order.details}** is brewed and ready for delivery! 📦`
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

const getRandomBrewTime = () => {
	const brewTime = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
	return brewTime * 1000;
};

export const createOrderEmbed = (order: any, statusMessage: string) => {
	const colors = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#1abc9c"];
	const randomColor = colors[Math.floor(Math.random() * colors.length)];

	return new EmbedBuilder()
		.setColor(randomColor as `#${string}`)
		.setTitle(`Order #${order.id}`)
		.setDescription(statusMessage)
		.setTimestamp();
};

const updateOrderStatusWithDelay = async (
	order: any,
	newStatus: OrderStatus,
	delay: number,
	user: any,
	statusMessage: string
) => {
	try {
		await new Promise((resolve) => setTimeout(resolve, delay));

		// Re-fetch to check current status
		const latestOrder = await db.orders.findUnique({ where: { id: order.id } });
		if (!latestOrder || latestOrder.status === OrderStatus.Cancelled) {
			return;
		}

		// ✅ Actually update the status now
		await db.orders.update({
			where: { id: order.id },
			data: { status: newStatus },
		});

		const embed = createOrderEmbed(order, statusMessage);

		if (orderMessages.has(order.id)) {
			const existingMessage = orderMessages.get(order.id);
			if (existingMessage) {
				await existingMessage.edit({ embeds: [embed] });
			}
		} else {
			const sentMessage = await user.send({ embeds: [embed] });
			orderMessages.set(order.id, sentMessage);
		}
	} catch (error) {
		console.error(`Error updating order #${order.id} status to ${newStatus}:`, error);
	}
};

const deliverOrder = async (order: any, user: any) => {
	try {
		const orderWithImage = await db.orders.findUnique({
			where: { id: order.id },
			include: { drinkImage: true },
		});

		const imageUrl = orderWithImage?.drinkImage?.url ?? "https://via.placeholder.com/400";

		await db.orders.update({
			where: { id: order.id },
			data: { status: OrderStatus.Delivered },
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
				.setDescription(`Your order **#${order.id}** has been successfully delivered! Enjoy your drink! 🍹`)
				.setImage(imageUrl)
				.setTimestamp()
				.setFooter({ text: "Thanks for ordering with us!" });

			await channel.send({
				content: `<@${order.user}>`,
				embeds: [embed],
				allowedMentions: { users: [order.user] },
			});

			orderMessages.delete(order.id);
		} else {
			console.error(`The channel for order #${order.id} does not support sending messages.`);
		}
	} catch (error) {
		console.error(`Error delivering order #${order.id}:`, error);
	}
};
