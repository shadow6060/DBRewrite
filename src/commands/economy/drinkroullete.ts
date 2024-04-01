import { OrderStatus } from "@prisma/client";
import { db } from "../../database/database";
import {
	generateOrderId,
	getClaimedOrder,
	getUserActiveOrder,
	hasActiveOrder,
	matchActiveOrder,
	matchOrderStatus,
	orderEmbedAsync,
} from "../../database/order";
import { getUserInfo, upsertUserInfo } from "../../database/userInfo";
import { client } from "../../providers/client";
import { config, constants, text } from "../../providers/config";
import { mainGuild, mainChannels, mainRoles } from "../../providers/discord";
import { permissions, mainChannels, mainRoles } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";

export const command = new Command("drinkroullete", "Get a random drink ordered!")
	.setExecutor(async int => {
        if (await hasActiveOrder(int.user)) {
			await int.reply(text.commands.order.exists);
			return; 
		}
		const drink = format(sampleArray(text.commands.drinkingr.drinks));
		const order = await db.order.create({
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
				tag: int.user.tag,
			})
		);
		await int.reply(`You got ${order.details}! Please enjoy your free gain!`);
	});
