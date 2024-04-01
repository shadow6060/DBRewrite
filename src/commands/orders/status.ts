import {getUserActiveOrder} from "../../database/orders";
import {text} from "../../providers/config";
import {permissions} from "../../providers/permissions";
import {Command} from "../../structures/Command";
import {EmbedBuilder} from "discord.js";

export const command = new Command("status", "Checks the status of your current order.")
	.addPermission(permissions.employee)
	.setExecutor(async int => {
		const order = await getUserActiveOrder(int.user);
		if (!order) {
			await int.reply(text.common.noActiveOrder);
			return;
		}
		const embed = new EmbedBuilder()
			.setColor("#0099ff")
			.setTitle("Order Status")
			.setDescription(`The status of your order is ${order.status}.`);
		await int.reply({embeds: [embed]});
	});
