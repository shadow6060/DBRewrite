import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { generateOrderId, getClaimedOrder, hasActiveOrder, matchActiveOrder, matchOrderStatus } from "../../../database/order";
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { client } from "../../../providers/client";
import { config, constants, text } from "../../../providers/config";
import { mainGuild } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";
import { randRange } from "../../../utils/utils";

export const command = new Command("brew", "Brews your claimed order.")
	.addPermission(permissions.employee)
	.addOption("string", o => o.setRequired(true).setName("image").setDescription("The image to attach."))
	.setExecutor(async int => {
		const order = await getClaimedOrder(int.user);
		if (!order) {
			await int.reply(text.common.noClaimedOrder);
			return;
		}
		const image = int.options.getString("image", true);
		if (!/https?:\/\//.test(image)) {
			await int.reply(text.commands.brew.invalidUrl);
			return;
		}
		const time = randRange(...constants.brewTimeRangeMs);
		await db.order.update({
			where: {
				id: order.id,
			},
			data: {
				status: OrderStatus.Brewing,
				image,
				timeout: new Date(Date.now() + time),
			},
		});
		await upsertWorkerInfo(int.user);
		await db.workerInfo.update({
			where: {
				id: int.user.id,
			},
			data: {
				preparations: { increment: 1 },
			},
		});
		await int.reply(text.commands.brew.success);
	});
