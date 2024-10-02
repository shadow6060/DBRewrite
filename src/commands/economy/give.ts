import { User } from "discord.js";
import { db } from "../../database/database";
import { getUserInfo, updateBalance } from "../../database/userInfo";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";

export const command = new Command("give", "Give someone some money.")
	.addUserOption(o => o.setName("receiver").setDescription("Select the user you want to give money to.").setRequired(true))
	.addOption("integer", o => o.setName("money").setDescription("The amount to give.").setRequired(true))
	.setExecutor(async int => {
		const user = int.user;
		const receiver = int.options.getUser("receiver") as User; // Extract user directly from the option
		const tip = int.options.get("money", true).value as number;

		const userInfo = await getUserInfo(int.user);
		if (!userInfo || userInfo.balance < tip) {
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

		const receiverUserInfo = await getUserInfo(receiver.id);
		if (receiverUserInfo) {
			await db.userInfo.update({
				where: { id: receiver.id },
				data: {
					balance: { increment: tip },
					...(receiverUserInfo.donuts !== undefined && { donuts: receiverUserInfo.donuts })
				}
			});
		} else {
			await db.userInfo.update({
				where: { id: receiver.id },
				data: { balance: { increment: tip } }
			});
		}

		await int.reply(`You successfully transferred ${tip} to <@${receiver.id}>`);
	});
