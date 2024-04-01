/* eslint-disable indent */
import { db } from "../../database/database";
import { getUserInfo } from "../../database/userInfo";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";

export const command = new Command("give", "Give someone some money.")
	.addOption("integer", o => o.setName("money").setDescription("The amount to give.").setRequired(true))
	.addOption("string", o => o.setName("receiver").setDescription("Please use their id").setRequired(true))
	.setExecutor(async int => {
		const user = int.user;
		const tip = int.options.get("money", true).value as number;
		const receiver = int.options.get("receiver", true).value as string;
		const info = await getUserInfo(int.user);
		if (!info || info.balance < tip) {
			await int.reply(text.common.notEnoughBalance);
			return;
		}
		if (tip > 5000) {
			await int.reply("Funny this safety thing stopping your transaction of 5000+");
			return;
		}
		await db.userInfo.update({
			where: { id: int.user.id },
			data: { balance: { decrement: tip } }
		});
		await db.userInfo.update({
			where: { id: receiver },
			data: { balance: { increment: tip } }
		});

		await int.reply(`You successfully transferred ${tip} to <@${receiver}>`);
		return; // Ensure the function returns Promise<void>
	});
