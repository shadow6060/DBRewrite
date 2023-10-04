/* eslint-disable no-constant-condition */
/* eslint-disable quotes */
// Main code
import { CafeStatus, OrderStatus } from "@prisma/client";
import { ChannelType, GuildChannel, StringSelectMenuBuilder, CommandInteraction, ComponentType, EmbedBuilder } from "discord.js";
import { db } from "../../../database/database";
import { orderPlaceholders, generateOrderId } from "../../../database/orders";
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { client } from "../../../providers/client";
import { text } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";

export const command = new Command(
	"deliver",
	"Delivers an order."
)
	.addPermission(permissions.employee)
	.setExecutor(async (int: CommandInteraction) => {
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("deliver_option")
			.setPlaceholder("Select a delivery option")
			.addOptions({
				label: "Single Order",
				description: "Deliver a single order",
				value: "single",
			})
			.addOptions({
				label: "Multiple Orders",
				description: "Deliver multiple orders",
				value: "multiple",
			});

		const actionRow = {
			type: ComponentType.ActionRow,
			components: [selectMenu],
		};

		const embed = new EmbedBuilder()
			.setDescription("Please select a delivery option.")
			.setColor("#00FF00");

		await int.reply({
			embeds: [embed],
			components: [actionRow],
			ephemeral: true,
		});
	});

// Interaction Create Event (for handling select menu interaction)
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isStringSelectMenu()) return;

	const componentId = interaction.customId;

	if (componentId === "deliver_option") {
		const selectedOption = interaction.values[0];

		if (selectedOption === "single" || selectedOption === "multiple") {
			console.log(`Handling ${selectedOption} order(s)...`);

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId(selectedOption === "single" ? "deliver_order" : "deliver_multiple_orders")
				.setPlaceholder(`Select ${selectedOption === "single" ? "an" : "multiple"} order${selectedOption === "single" ? "" : "s"} to deliver`);

			const orders = await db.orders.findMany({
				where: {
					status: OrderStatus.PendingDelivery,
				},
				select: {
					id: true,
					user: true,
				},
			});

			if (orders.length === 0) {
				await interaction.reply({ content: "No orders available for delivery.", ephemeral: false });
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
				.setDescription(`Please select ${selectedOption === "single" ? "an" : "multiple"} order${selectedOption === "single" ? "" : "s"} to deliver.`)
				.setColor("#00FF00");

			await interaction.reply({
				embeds: [embed],
				components: [actionRow],
				ephemeral: true,
			});
			return;
		}
	}

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
			await interaction.reply({ content: text.commands.deliver.noChannel, ephemeral: true });
			return;
		}

		await interaction.reply({ content: `${text.commands.deliver.success}${info?.deliveryMessage ? "" : `\n${text.commands.deliver.noMessage}`}`, ephemeral: false });
		await channel.send(format(info?.deliveryMessage || text.commands.deliver.default, await orderPlaceholders(order)));
	}

	if (componentId === "deliver_multiple_orders") {
		const orderIds = interaction.values;

		const selectedOrders = await db.orders.findMany({
			where: {
				id: { in: orderIds },
				status: OrderStatus.PendingDelivery,
			},
		});

		if (selectedOrders.length === 0) {
			await interaction.reply({ content: "No valid orders selected.", ephemeral: true });
			return;
		}

		const info = await upsertWorkerInfo(interaction.user);

		const message = `Delivering ${selectedOrders.length} order(s)...`;

		for (let i = 0; i < selectedOrders.length; i++) {
			const order = selectedOrders[i];

			await db.orders.update({
				where: {
					id: order.id,
				},
				data: {
					status: OrderStatus.Delivered,
					deliverer: interaction.user.id,
				},
			});

			const channel = client.channels.cache.get(order.channel) ?? await client.channels.fetch(order.channel).catch(() => null);
			if (channel && (channel instanceof GuildChannel && channel.type === ChannelType.GuildText)) {
				await channel.send(format(info?.deliveryMessage || text.commands.deliver.default, await orderPlaceholders(order)));
			}
		}

		await db.workerInfo.update({
			where: {
				id: interaction.user.id,
			},
			data: {
				deliveries: { increment: selectedOrders.length },
			},
		});

		await interaction.reply({ content: `${text.commands.deliver.multiSuccess.replace("{count}", selectedOrders.length.toString())}${info?.deliveryMessage ? "" : `\n${text.commands.deliver.noMessage}`}`, ephemeral: true });
	}
});
