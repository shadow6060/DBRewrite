import { db } from "../../database/database";
import { generateOrderId, hasActiveOrder } from "../../database/orders";
import { text } from "../../providers/config";
import { mainChannels, mainRoles } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("order", "Orders a drink.")
	.addOption("string", (o) =>
		o.setName("drink").setDescription("The drink to order.").setRequired(true)
	)
	.setExecutor(async (int) => {
		if (await hasActiveOrder(int.user)) {
			await int.reply(text.commands.order.exists);
			return;
		}

		// Check the number of existing orders
		/*
		const orderCount = await db.cafeOrders.count();
		const maxOrderLimit = 25;

		if (orderCount >= maxOrderLimit) {
			await int.reply(`The maximum order limit of ${maxOrderLimit} has been reached. Try again later.`);
			return;
		}
		*/

		const drink = int.options.getString("drink", true);

		// Check the length of the drink description
		const maxDescriptionLength = 100; // Adjust this value as needed
		if (drink.length > maxDescriptionLength) {
			await int.reply(`Your order details are too long. Please limit them to ${maxDescriptionLength} characters.`);
			return;
		}

		const order = await db.orders.create({
			data: {
				id: await generateOrderId(),
				user: int.user.id,
				details: drink,
				channel: int.channelId,
				guild: int.guildId,
			},
		});

		await int.reply(format(text.commands.order.success, { id: order.id, details: drink }));

		if (int.member.nickname?.toLowerCase() === "bart") {
			await int.followUp("I will end you");
		}

		await mainChannels.brewery.send(
			format(text.commands.order.created, {
				details: drink,
				duty: mainRoles.duty.toString(),
				id: order.id,
				tag: int.user.tag,
			})
		);
	});
