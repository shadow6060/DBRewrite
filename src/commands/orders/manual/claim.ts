import { CommandInteraction } from "discord.js";
import {
	StringSelectMenuBuilder,
	ComponentType,
	EmbedBuilder,
	MessageFlags
} from "discord.js";
import { subHours } from "date-fns";

import { ExtendedCommand } from "../../../structures/extendedCommand";
import { permissions } from "../../../providers/permissions";
import { client } from "../../../providers/client";
import { db } from "../../../database/database";
import { OrderStatus } from "@prisma/client";
import { text } from "../../../providers/config";
import { isManualMode } from "../../../utils/MysticUtils/settings";

export const command = new ExtendedCommand(
	{ name: "claim", description: "Claims an order.", local: true }
)
	.addPermission(permissions.employee)
	.setCategory("👊manual")
	.setExecutor(async (int: CommandInteraction) => {
		// ✅ Check if in manual mode
		const manualMode = await isManualMode();
		if (!manualMode) {
			await int.reply({
				content: "🛑 You can’t claim orders while in automatic mode.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		// Check if user already claimed an order
		const existingOrder = await db.orders.findFirst({
			where: {
				claimer: int.user.id,
				status: OrderStatus.Preparing
			}
		});

		if (existingOrder) {
			await int.reply({
				content: text.commands.claim.existing,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		// Get unclaimed orders
		const thresholdTime = subHours(new Date(), 5);
		let orders = await db.orders.findMany({
			where: {
				status: OrderStatus.Unprepared,
				createdAt: {
					lt: thresholdTime,
				},
			},
			select: {
				id: true,
				user: true,
				details: true,
			},
			orderBy: { createdAt: "asc" },
			take: 25,
		});

		if (orders.length === 0) {
			// Fallback: fetch newer orders
			orders = await db.orders.findMany({
				where: { status: OrderStatus.Unprepared },
				select: {
					id: true,
					user: true,
					details: true,
				},
				orderBy: { createdAt: "asc" },
				take: 25,
			});
		}

		if (orders.length === 0) {
			await int.reply({
				content: "There are no available orders to claim.",
				ephemeral: true
			});
			return;
		}

		// Categorize orders based on drink type
		const categorizedOrders = orders.reduce((acc, order) => {
			const drinkCategory = order.details.toLowerCase().includes("coffee") ? "☕ Coffee" : "🍹 Cocktails";
			if (!acc[drinkCategory]) acc[drinkCategory] = [];
			acc[drinkCategory].push(order);
			return acc;
		}, {} as Record<string, { id: string, details: string, user: string }[]>);

		// Generate options for the select menu with categorized orders
		const options = Object.keys(categorizedOrders).flatMap((category) => {
			return categorizedOrders[category].map((order) => ({
				label: `${category} - ${order.id}`,
				description: `Details: ${order.details.slice(0, 47)}... | User: ${order.user.slice(0, 20)}`,
				value: order.id
			}));
		});

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("claim_order")
			.setPlaceholder("Select an order to claim")
			.addOptions(options);

		const actionRow = {
			type: ComponentType.ActionRow,
			components: [selectMenu],
		};

		const embed = new EmbedBuilder()
			.setTitle("Order Claim Menu")
			.setDescription("Please select an order to claim from the list below.")
			.setColor("#00FF00")
			.setFooter({ text: "Orders available for you to claim." });

		await int.reply({
			embeds: [embed],
			components: [actionRow],
			ephemeral: true,
		});
	});

// 📦 Handle the select menu interaction
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isStringSelectMenu()) return;
	if (interaction.customId !== "claim_order") return;

	const orderId = interaction.values[0];

	const order = await db.orders.findUnique({ where: { id: orderId } });
	if (!order) {
		await interaction.reply({
			content: "❌ Invalid order selected.",
			ephemeral: true,
		});
		return;
	}

	await db.orders.update({
		where: { id: orderId },
		data: {
			claimer: interaction.user.id,
			status: OrderStatus.Preparing
		}
	});

	const replyMessage = await interaction.reply({
		content: text.commands.claim.success
			.replace("{id}", order.id)
			.replace("{user}", interaction.user.username),
		flags: MessageFlags.Ephemeral,
	});

	setTimeout(async () => {
		await replyMessage.delete();
	}, 2000);
});
