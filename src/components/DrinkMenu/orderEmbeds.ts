import { OrderStatus } from "@prisma/client";
import { EmbedBuilder, TextChannel } from "discord.js";
import { db } from "../../database/database";
import { generateOrderId } from "../../database/orders";
import { mainChannels, mainRoles } from "../../providers/discord";

export async function createAndSendOrderEmbed({
	interaction,
	drink,
	manualMode,
}: {
	interaction: any;
	drink: {
		id: number;
		drinkName: string;
		url?: string;
		category?: string;
		price: number | null;
	};
	manualMode?: boolean;
}) {
	const order = await db.orders.create({
		data: {
			id: await generateOrderId(),
			user: interaction.user.id,
			details: drink.drinkName,
			channel: interaction.channelId!,
			guild: interaction.guildId!,
			status: manualMode ? OrderStatus.Unprepared : OrderStatus.Preparing,
			drinkImageId: drink.id,
		},
	});

	const embed = new EmbedBuilder()
		.setTitle(manualMode ? "📥 New Manual Order" : "📥 New Auto Order")
		.setDescription(
			manualMode
				? "A new **manual** drink order has been placed!"
				: "A new drink order has been placed!"
		)
		.addFields(
			{ name: "Customer", value: interaction.user.tag, inline: true },
			{ name: "Order ID", value: `\`${order.id}\``, inline: true },
			{ name: "Drink", value: drink.drinkName, inline: false },
			{ name: "Status", value: order.status, inline: true }
		)
		.setColor(manualMode ? 0xf39c12 : 0x8e44ad)
		.setTimestamp();

	const breweryChannel = mainChannels.brewery as TextChannel;

	await breweryChannel.send({
		content: manualMode ? `${mainRoles.duty}` : undefined,
		embeds: [embed],
	});
}
