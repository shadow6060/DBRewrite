import { db } from "../../database/database";
import { generateOrderId, hasActiveOrder } from "../../database/order";
import { text } from "../../providers/config";
import { mainChannels, mainRoles } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("order", "Orders a drink.")
	.addOption("string", o => o.setName("drink").setDescription("The drink to order.").setRequired(true))
	.setExecutor(async int => {
		if (await hasActiveOrder(int.user)) {
			await int.reply(text.commands.order.exists);
			return;
		}
		const drink = int.options.getString("drink", true); // Why the FUCK do options not default to required
		const order = await db.order.create({
			data: {
				id: await generateOrderId(),
				user: int.user.id,
				details: drink,
				channel: int.channelId,
				guild: int.guildId,
			},
		});
		await int.reply(format(text.commands.order.success, { id: order.id, details: drink }));
		if (int.member.nickname?.toLowerCase() === "bart") int.followUp("i will end you");
		await mainChannels.brewery.send(
			format(text.commands.order.created, {
				details: drink,
				duty: mainRoles.duty.toString(),
				id: order.id,
				tag: int.user.tag,
			})
		);
	});
