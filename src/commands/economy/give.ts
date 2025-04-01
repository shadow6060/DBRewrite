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

		// Ensure the sender exists in the database
		let userInfo = await getUserInfo(user.id);
		if (!userInfo) {
			await db.userInfo.create({
				data: { id: user.id, balance: 0, donuts: 0 }
			});
			userInfo = (await getUserInfo(user.id))!; // Assert it's not null
		}

		// Check if the sender has enough balance
		if (userInfo.balance < tip) {
			await int.reply(text.common.notEnoughBalance);
			return;
		}

		if (tip > 5000) {
			await int.reply("Funny this safety thing stopping your transaction of 5000+");
			return;
		}

		// Deduct balance from sender
		await db.userInfo.update({
			where: { id: user.id },
			data: { balance: { decrement: tip } }
		});

		// Ensure the receiver exists in the database
		let receiverUserInfo = await getUserInfo(receiver.id);
		if (!receiverUserInfo) {
			await db.userInfo.create({
				data: { id: receiver.id, balance: 0, donuts: 0 }
			});
			receiverUserInfo = (await getUserInfo(receiver.id))!; // Assert it's not null
		}

		// Add balance to receiver
		await db.userInfo.update({
			where: { id: receiver.id },
			data: {
				balance: { increment: tip },
				...(receiverUserInfo.donuts !== undefined && { donuts: receiverUserInfo.donuts })
			}
		});

		await int.reply(`You successfully transferred ${tip} to <@${receiver.id}>`);
	});
