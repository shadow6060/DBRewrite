/* eslint-disable indent */
/* eslint-disable no-constant-condition */
/* eslint-disable quotes */
// Main code
import { CafeStatus, OrderStatus } from "@prisma/client";
import { ChannelType, GuildChannel, StringSelectMenuBuilder, CommandInteraction, ComponentType, EmbedBuilder, PartialGroupDMChannel } from "discord.js";
import { db } from "../../../database/database";
import { orderPlaceholders, generateOrderId } from "../../../database/orders";
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { client } from "../../../providers/client";
import { text } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";
import { upsertWorkerStats } from "../../../database/workerstats";
import { ExtendedCommand } from "../../../structures/extendedCommand";

export const command = new ExtendedCommand(
	{ name: "deliver", description: "Delivers an order.", local: true }
)
	.addPermission(permissions.employee)
	.setExecutor(async (int: CommandInteraction) => {
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("deliver_order")
			.setPlaceholder("Select an order to deliver");

		const orders = await db.orders.findMany({
			where: {
				status: OrderStatus.PendingDelivery,
			},
			take: 25,
			select: {
				id: true,
				user: true
			},
		});

		if (orders.length === 0) {
			await int.reply({ content: "No orders available for delivery.", ephemeral: false });
			return;
		}

		if (orders.length > 25) {
			orders.splice(25); // Limit the number of orders to 25
		}

		for (const order of orders) {
			selectMenu.addOptions({
				label: order.id,
				description: `User: ${order.user}`,
				value: order.id,
			});
		}

		const actionRow = {
			type: ComponentType.ActionRow,
			components: [selectMenu],
		};

		const embed = new EmbedBuilder()
			.setDescription("Please select an order to deliver.")
			.setColor("#00FF00");

		// Set last command to "deliver" when preparing to deliver
		await upsertWorkerStats(int.user, { lastCommand: "deliver" });

		await int.reply({
			embeds: [embed],
			components: [actionRow],
			ephemeral: true, // Set ephemeral to true by default
		});
	});

// Interaction Create Event (for handling select menu interaction)
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isStringSelectMenu()) return;

	const componentId = interaction.customId;
	if (componentId === "deliver_order") {
		const orderId = interaction.values[0];

		const order = await db.orders.findUnique({
			where: {
				id: orderId,
			},
		});

		if (!order) {
			await interaction.reply({ content: "Invalid order selected.", ephemeral: true });
			return;
		}

		if (order.user === interaction.user.id && !permissions.developer.hasPermission(interaction.user)) {
			await interaction.reply({ content: text.common.interactOwn, ephemeral: false });
			return;
		}

		const info = await upsertWorkerInfo(interaction.user);
		await db.workerInfo.update({
			where: {
				id: interaction.user.id,
			},
			data: {
				deliveries: { increment: 1 },
			},
		});
		// Update worker stats for delivered orders
		await upsertWorkerStats(interaction.user, { ordersDelivered: 1, lastCommand: "deliver" });

		await db.orders.update({
			where: {
				id: orderId,
			},
			data: {
				status: OrderStatus.Delivered,
				deliverer: interaction.user.id,
			},
		});

		const channel = client.channels.cache.get(order.channel) ?? await client.channels.fetch(order.channel).catch(() => null) ?? client.users.cache.get(order.user);
		if (!channel || (channel instanceof GuildChannel && channel.type !== ChannelType.GuildText)) {
			await interaction.reply({ content: text.commands.deliver.noChannel, ephemeral: true }); // Set ephemeral to true
			return;
		}

		await interaction.reply({ content: `${text.commands.deliver.success}${info?.deliveryMessage ? "" : `\n${text.commands.deliver.noMessage}`}`, ephemeral: false });
		// unable to send to partial group dm channel, workaround by checking if the channel is a partial group dm channel
		if (!(channel instanceof PartialGroupDMChannel)) channel.send(format(info?.deliveryMessage || text.commands.deliver.default, await orderPlaceholders(order)));
	}
});
