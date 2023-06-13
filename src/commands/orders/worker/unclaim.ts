/* eslint-disable quotes */
import { StringSelectMenuBuilder, CommandInteraction, ComponentType, EmbedBuilder } from "discord.js";
import { Command } from "../../../structures/Command";
import { permissions } from "../../../providers/permissions";
import { OrderStatus, getClaimedOrder, } from "../../../database/orders";
import { db } from "../../../database/database";
import { text } from "../../../providers/config";
import { client } from "../../../providers/client";

export const command = new Command("unclaim", "Allows you to unclaim an order.")
	.addPermission(permissions.employee)
	.setExecutor(async (int: CommandInteraction) => {
		const claimedOrder = await getClaimedOrder(int.user);
		if (!claimedOrder) {
			await int.reply({ content: text.commands.unclaim.notClaimed, ephemeral: true });
			return;
		}

		const order = await db.orders.findUnique({
			where: {
				id: claimedOrder.id,
			},
			select: {
				id: true,
				user: true,
				details: true, // Include the 'details' property
			},
		});

		if (!order) {
			await int.reply({ content: "Invalid order selected.", ephemeral: true });
			return;
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("unclaim_order")
			.setPlaceholder("Select the order to unclaim")
			.addOptions([
				{
					label: order.id,
					description: `Details: ${order.details}\nUser: ${order.user}}`, // Include the 'details' property
					value: order.id,
				},
			]);

		const actionRow = {
			type: ComponentType.ActionRow,
			components: [selectMenu],
		};

		const embed = new EmbedBuilder()
			.setDescription("Please select the order to unclaim.")
			.setColor("#FF0000");

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
	if (componentId === "unclaim_order") {
		const orderId = interaction.values[0];

		const order = await db.orders.findUnique({
			where: {
				id: orderId,
			},
			select: {
				id: true,
				user: true,
				claimer: true,
			},
		});

		if (!order) {
			await interaction.reply({ content: "Invalid order selected.", ephemeral: true });
			return;
		}

		if (order.claimer !== interaction.user.id) {
			await interaction.reply({ content: text.commands.unclaim.notClaimed, ephemeral: true });
			return;
		}

		await db.orders.update({
			where: { id: orderId },
			data: { claimer: null, status: OrderStatus.Unprepared },
		});

		await interaction.reply({
			content: text.commands.unclaim.success.replace('{id}', order.id),
			ephemeral: false,
		});
	}
});
