import { OrderStatus } from "@prisma/client";
import { CategoryChannel, GuildChannel } from "discord.js";
import { db } from "../../../database/database";
import { generateOrderId, getClaimedOrder, hasActiveOrder, matchActiveOrder, matchOrderStatus, orderPlaceholders } from "../../../database/order";
import { getWorkerInfo, upsertWorkerInfo } from "../../../database/workerInfo";
import { client } from "../../../providers/client";
import { config, text } from "../../../providers/config";
import { mainGuild } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";

export const command = new Command("deliver", "Delivers an order.")
	.addPermission(permissions.employee)
	.addOption("string", o => o.setRequired(true).setName("order").setDescription("The order to deliver."))
	.setExecutor(async int => {
		const match = int.options.getString("order", true); 
		const order = await matchOrderStatus(match, OrderStatus.PendingDelivery);
		if (order === null) {
			await int.reply(text.common.invalidOrderId);
			return;
		}
		if (order.user === int.user.id && !permissions.developer.hasPermission(int.user)) {
			await int.reply(text.common.interactOwn);
			return;
		}
		const info = await upsertWorkerInfo(int.user);
		await db.workerInfo.update({
			where: {
				id: int.user.id,
			},
			data: {
				deliveries: { increment: 1 },
			},
		});
		await db.order.update({ where: { id: order.id }, data: { status: OrderStatus.Delivered, deliverer: int.user.id } });
		const channel = client.channels.cache.get(order.channel) ?? await client.channels.fetch(order.channel).catch(() => null) ?? client.users.cache.get(order.user);
		if (!channel || (channel instanceof GuildChannel && !channel.isText())) {
			await int.reply(text.commands.deliver.noChannel);
			return;
		}
		await int.reply(`${text.commands.deliver.success}${info?.deliveryMessage ? "" : `\n${text.commands.deliver.noMessage}`}`);
		await channel.send(format(info?.deliveryMessage ?? text.commands.deliver.default, await orderPlaceholders(order)));
	});
