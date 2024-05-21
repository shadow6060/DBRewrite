//unclaim
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { Command } from "../../../structures/Command";
import { permissions } from "../../../providers/permissions";
import { OrderStatus, getClaimedOrder } from "../../../database/orders";
import { db } from "../../../database/database";
import { text } from "../../../providers/config";
import { client } from "../../../providers/client";
import { CommandInteraction, StringSelectMenuBuilder, ComponentType, EmbedBuilder } from "discord.js";
import { ExtendedCommand } from "../../../structures/extendedCommand";

export const command = new ExtendedCommand(
	{ name: "unclaim", description: "Allows you to unclaim an order.", local: true }
)
	.addPermission(permissions.employee)
	.setExecutor(async (int: CommandInteraction) => {
		let orders;
		if (await permissions.admin.hasPermission(int.user)) {
			// If the user is an admin, fetch all claimed orders
			orders = await db.orders.findMany({
				where: {
					status: OrderStatus.Preparing,
				},
				select: {
					id: true,
					user: true,
					details: true,
				},
			});
		} else {
			// If the user is not an admin, fetch only their own claimed orders
			orders = await db.orders.findMany({
				where: {
					claimer: int.user.id,
					status: OrderStatus.Preparing,
				},
				select: {
					id: true,
					user: true,
					details: true,
				},
			});
		}

		console.log("Fetched orders: ", orders); // Debug log

		if (orders.length === 0) {
			await int.reply({ content: "You don't have any orders to unclaim.", ephemeral: true });
			return;
		}

		const options = orders.map(order => {
			const details = order.details.length > 50 ? `${order.details.substring(0, 47)}...` : order.details;
			const user = order.user.length > 50 ? `${order.user.substring(0, 47)}...` : order.user;

			return {
				label: order.id,
				description: `Details: ${details}\nUser: ${user}`,
				value: order.id,
				details: order.details,
			};
		});

		const minValues = Math.min(1, orders.length);
		const maxValues = Math.min(3, orders.length);

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("unclaim_order")
			.setPlaceholder("Select orders to unclaim")
			.addOptions(options)
			.setMinValues(minValues)  // Set minimum selected values
			.setMaxValues(maxValues);  // Set maximum selected values

		const actionRow = {
			type: ComponentType.ActionRow,
			components: [selectMenu],
		};

		const embed = new EmbedBuilder()
			.setDescription("Please select orders to unclaim.")
			.setColor("#FF0000");

		await int.reply({
			embeds: [embed],
			components: [actionRow],
			ephemeral: true,
		});
	});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isStringSelectMenu()) return;

	const componentId = interaction.customId;
	if (componentId === "unclaim_order") {
		const orderIds = interaction.values;
		const unclaimedOrderMessages = [];

		for (const orderId of orderIds) {
			try {
				if (await permissions.admin.hasPermission(interaction.user)) {
					// If the user is an admin, forcefully unclaim the order
					await db.orders.update({
						where: { id: orderId },
						data: { claimer: null, status: OrderStatus.Unprepared },
					});

					unclaimedOrderMessages.push(`Order ${orderId} forcefully unclaimed by admin.`);
				} else {
					// Check if the order is claimed by the user
					const order = await db.orders.findFirst({
						where: {
							id: orderId,
							claimer: interaction.user.id,
							status: OrderStatus.Preparing,
						},
					});

					if (!order) {
						unclaimedOrderMessages.push(`Order ${orderId} is not claimed by you.`);
						continue;
					}

					// Update the claimed order
					await db.orders.update({
						where: { id: orderId },
						data: { claimer: null, status: OrderStatus.Unprepared },
					});

					unclaimedOrderMessages.push(`Order ${orderId} unclaimed successfully.`);
				}
			} catch (error) {
				console.error(`Error processing Order ${orderId}:`, error);
				unclaimedOrderMessages.push(`Error processing Order ${orderId}`);
			}
		}

		// Send a single reply summarizing the unclaimed orders
		await interaction.reply({
			content: `Unclaiming results:\n${unclaimedOrderMessages.join("\n")}`,
			ephemeral: false,
		});
	}
});
