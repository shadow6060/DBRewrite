import { CommandInteractionOptionResolver } from "discord.js";
import { db } from "../../database/database";
import { generateOrderId, hasActiveOrder } from "../../database/orders";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import { OrderStatus, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const command = new Command("order", "Orders a drink.")
	.addOption("string", (o) =>
		o.setName("drink").setDescription("The drink to order.").setRequired(true)
	)
	.setExecutor(async (int) => {
		if (await hasActiveOrder(int.user)) {
			await int.reply(text.commands.order.exists);
			return;
		}

		const options = int.options as CommandInteractionOptionResolver;
		const drink = options.getString("drink", true).toLowerCase();

		// Fetch image from the database for the drink
		const drinkImage = await prisma.drinkImage.findUnique({
			where: { drinkName: drink }
		});

		if (!drinkImage) {
			await int.reply("Sorry, we couldn't find an image for this drink.");
			return;
		}

		// Create order with image
		const order = await db.orders.create({
			data: {
				id: await generateOrderId(),
				user: int.user.id,
				details: drink,
				channel: int.channelId,
				guild: int.guildId,
				image: drinkImage.url, // Store the drink image URL in the order
				status: OrderStatus.Preparing, // Automatically set the initial status
			},
		});

		await int.reply(format(text.commands.order.success, { id: order.id, details: drink }));
	});
