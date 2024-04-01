import { MessageEmbed } from "discord.js";
import { db } from "../../database/database";
import { generateOrderId, getLatestOrder, hasActiveOrder, OrderFlags } from "../../database/order";
import { getUserInfo } from "../../database/userInfo";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("tip", "Tip your last order.")
	.addOption("integer", o => o.setName("money").setDescription("The amount to tip.").setRequired(true))
	.setExecutor(async int => {
		const lastOrder = await getLatestOrder(int.user);
		if (!lastOrder) {
			await int.reply(text.common.noOrders);
			return;
		}
		if (lastOrder.flags & OrderFlags.Tipped) {
			await int.reply(text.commands.tip.alreadyTipped);
			return;
		}
		const tip = int.options.getInteger("money", true);
		if (tip % 1 || tip < 0) {
			await int.reply(text.common.invalidNatural);
			return;
		}
		const info = await getUserInfo(int.user);
		if (!info || info.balance < tip) {
			await int.reply(text.common.notEnoughBalance);
			return;
		}
		await int.reply(format(text.commands.tip.success, tip, lastOrder.details));
		const tcte = text.commands.tip.embed;
		await mainChannels.tips.send({
			embeds: [
				new MessageEmbed()
					.setTitle(tcte.title)
					.setDescription(
						format(tcte.description, lastOrder.id, tip, `<@${lastOrder.claimer}>`, `<@${lastOrder.deliverer}>`)
					)
					.setFooter({ text: format(tcte.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),
			],
		});
		await db.order.update({
			where: { id: lastOrder.id },
			data: { flags: lastOrder.flags | OrderFlags.Tipped },
		});
		await db.userInfo.update({
			where: { id: int.user.id },
			data: { balance: { decrement: tip } }
		});
		await db.userInfo.updateMany({
			where: { id: { in: [lastOrder.claimer, lastOrder.deliverer].filter(Boolean) as string[] } },
			data: { balance: { increment: tip } }
		});
	});
