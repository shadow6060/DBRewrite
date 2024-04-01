import { OrderStatus } from "@prisma/client";
import { CategoryChannel, GuildChannel } from "discord.js";
import { db } from "../../../database/database";
import {
	generateOrderId,
	getClaimedOrder,
	hasActiveOrder,
	matchActiveOrder,
	matchOrderStatus,
	orderPlaceholders,
	requiredOrderPlaceholders,
} from "../../../database/order";
import { getWorkerInfo, upsertWorkerInfo } from "../../../database/workerInfo";
import { client } from "../../../providers/client";
import { config, text } from "../../../providers/config";
import { mainGuild } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";

const tcdp = text.commands.deliverymessage.placeholders;
const placeholderMessage = `${tcdp.title}\n${Object.entries(tcdp.list)
	.sort((a, b) => (requiredOrderPlaceholders.includes(b[0]) ? 1 : -1))
	.map(([k, v]) => format(requiredOrderPlaceholders.includes(k) ? tcdp.requiredFormat : tcdp.format, k, v))
	.join("\n")}`;

export const command = new Command("deliverymessage", "Configures your delivery message.")
	.addPermission(permissions.employee)
	.addSubCommand(s => s.setName("get").setDescription("Checks your current delivery message."))
	.addSubCommand(s => s.setName("placeholders").setDescription("Shows the list of delivery placeholders."))
	.addSubCommand(s =>
		s
			.setName("set")
			.setDescription("Sets your current delivery message.")
			.addStringOption(o => o.setName("message").setDescription("The delivery message.").setRequired(true))
	)
	.setExecutor(async int => {
		switch (int.options.getSubcommand(true)) {
			case "get": {
				const message = (await getWorkerInfo(int.user))?.deliveryMessage ?? text.commands.deliver.default;
				await int.reply(
					format(
						text.commands.deliverymessage.get,
						message,
						format(message, {
							preparer: "gordonramsay#3344",
							deliverer: int.user.tag,
							id: "3x4Mp13",
							details: "beef",
							mention: client.user.toString(),
							user: client.user.tag,
							image: int.user.displayAvatarURL(),
						})
					)
				);
				break;
			}
			case "set": {
				const message = int.options.getString("message", true);
				if (requiredOrderPlaceholders.some(x => !message.includes(`{${x}}`))) {
					await int.reply(
						format(
							text.commands.deliverymessage.set.missing,
							requiredOrderPlaceholders.map(x => `\`${x}\``).join(", ")
						)
					);
					return;
				}
				await upsertWorkerInfo(int.user);
				await db.workerInfo.update({
					where: { id: int.user.id },
					data: { deliveryMessage: message },
				});
				await int.reply(text.commands.deliverymessage.set.success);
				break;
			}
			case "placeholders": {
				await int.reply(placeholderMessage);
				break;
			}
		}
	});
