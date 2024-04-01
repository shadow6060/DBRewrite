import { EmbedBuilder } from "discord.js";
import { db } from "../../database/database";
import { getLatestOrder, OrderFlags } from "../../database/orders";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("feedback", "Give feedback on your last order.")
	.addOption("string", o => o.setName("feedback").setDescription("The feedback to give.").setRequired(true))
	.setExecutor(async int => {
		const lastOrder = await getLatestOrder(int.user);
		if (!lastOrder) {
			await int.reply(text.common.noOrders);
			return;
		}
		if (lastOrder.flags & OrderFlags.FeedbackGiven) {
			await int.reply(text.commands.feedback.alreadyGiven);
			return;
		}

		const feedback = int.options.get("feedback", true).value as string;
		await int.reply(format(text.commands.feedback.success, lastOrder.details));
		const tcfe = text.commands.feedback.embed;
		await mainChannels.feedback.send({
			embeds: [
				new EmbedBuilder()
					.setTitle(format(tcfe.title, lastOrder.id))
					.setDescription(feedback)
					.setFooter({ text: format(tcfe.footer, int.user.username), iconURL: int.user.displayAvatarURL() }),
			],
		});
		await db.orders.update({
			where: { id: lastOrder.id },
			data: { flags: lastOrder.flags | OrderFlags.FeedbackGiven }
		});
	});
