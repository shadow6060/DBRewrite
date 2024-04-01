/* eslint-disable quotes */
/* eslint-disable indent */
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { Command } from "../../../structures/Command";
import { permissions } from "../../../providers/permissions";
import { OrderStatus, getClaimedOrder } from "../../../database/orders";
import { db } from "../../../database/database";
import { text } from "../../../providers/config";
import { client } from "../../../providers/client";
import { CommandInteraction, StringSelectMenuBuilder, ComponentType, EmbedBuilder } from "discord.js";
import { ExtendedCommand } from "../../../structures/extendedCommand";

const claimedOrderLocks = new Map<string, boolean>();  // Map to store claim locks for each order ID
const claimedOrders = new Set<string>();  // Set to store claimed order IDs

export const command = new ExtendedCommand(
	{ name: "unclaim", description: "Allows you to unclaim an order.", local: true }
)
	.addPermission(permissions.employee)
	.setExecutor(async (int: CommandInteraction) => {
		const claimedOrder = await getClaimedOrder(int.user);
		if (!claimedOrder) {
			await int.reply({ content: text.commands.unclaim.notClaimed, ephemeral: true });
			return;
		}

		const orders = await db.orders.findMany({
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

				// Check if a claim lock exists for this order
				if (claimedOrderLocks.has(orderId) && claimedOrderLocks.get(orderId)) {
					unclaimedOrderMessages.push(`Another process is currently unclaiming Order ${orderId}. Please try again later.`);
					continue;
				}

				// Set an unclaim lock for this order
				claimedOrderLocks.set(orderId, true);

				// Update the claimed order and release the unclaim lock
				await db.orders.update({
					where: { id: orderId },
					data: { claimer: null, status: OrderStatus.Unprepared },
				});

				claimedOrders.delete(orderId);

				// Release the unclaim lock for this order
				claimedOrderLocks.delete(orderId);

				unclaimedOrderMessages.push(`Order ${orderId} unclaimed successfully.`);
			} catch (error) {
				console.error(`Error processing Order ${orderId}:`, error);
				unclaimedOrderMessages.push(`Error processing Order ${orderId}`);
			} finally {
				claimedOrderLocks.delete(orderId);
			}
		}

		// Send a single reply summarizing the unclaimed orders
		await interaction.reply({
			content: `Unclaiming results:\n${unclaimedOrderMessages.join('\n')}`,
			ephemeral: false,
		});
	}
});
