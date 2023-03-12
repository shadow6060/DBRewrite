//Switch the urls to attachment please thanks
//TypeScript
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

import type { CommandInteraction } from "discord.js";

export const command = new Command(
	"brew",
	"Brews your claimed order."
)
	.addSubCommand((subcommand) =>
		subcommand
			.setName("attach")
			.setDescription("Attach an image to your order.")
			.addAttachmentOption((option) =>
				option
					.setName("attachment")
					.setDescription("The image to attach to the order.")
					.setRequired(true)
			)
	)
	.addPermission(permissions.employee)
	.setExecutor(async (int: CommandInteraction) => {
		const order = await getClaimedOrder(int.user);
		if (!order) {
			await int.reply({ content: text.common.noClaimedOrder });
			return;
		}
		const attachment = int.options.get("attachment", true)?.attachment;
		if (!attachment) {
			await int.reply({ content: "Attachment is missing or not valid." });
			return;
		}
		const time = randRange(...constants.brewTimeRangeMs);
		await db.order.update({
			where: {
				id: order.id,
			},
			data: {
				status: OrderStatus.Brewing,
				image: attachment.url ?? "default.png",
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
		await int.reply({
			content: text.commands.brew.success,
			files: [attachment],
		});
	});
