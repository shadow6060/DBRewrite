/* eslint-disable linebreak-style */
import { db } from "../../database/database";
import { generateOrderId, hasActiveOrder, } from "../../database/orders";
import { text } from "../../providers/config";
import { mainChannels, mainRoles } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import { sampleArray } from "../../utils/utils";

export const command = new Command("drinkroullete", "Get a random drink ordered!")
	.setExecutor(async int => {
		if (await hasActiveOrder(int.user)) {
			await int.reply(text.commands.order.exists);
			return;
		}
		const drink = format(sampleArray(text.commands.drinkingr.drinks), ""); //todo: check if this is correct pls
		const order = await db.orders.create({
			data: {
				id: await generateOrderId(),
				user: int.user.id,
				details: drink,
				channel: int.channelId,
				guild: int.guildId,
			},
		});
		await mainChannels.brewery.send(
			format(text.commands.order.created, {
				details: drink,
				duty: mainRoles.duty.toString(),
				id: order.id,
				tag: int.user.username,
			})
		);
		await int.reply(`You got ${order.details}! Please enjoy your free gain!`);
	});
