// commands/economy/give.ts
import { User } from "discord.js";
import { db } from "../../database/database";
import { getUserInfo } from "../../database/userInfo";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { requireUserProfile } from "../../database/userInfo";

export const command = new Command("give", "Give someone some money.")
	.addUserOption(o =>
		o.setName("receiver").setDescription("Who to give money to").setRequired(true)
	)
	.addOption("integer", o =>
		o.setName("money").setDescription("Amount to give").setRequired(true)
	)
	.setCategory("💲economy")
	.setExecutor(async int => {
		const user = int.user;
		const receiver = int.options.getUser("receiver", true) as User;
		const amount = int.options.get("money", true).value as number;

		const userInfo = await requireUserProfile(user.id, int);
		if (!userInfo) return;

		if (userInfo.balance < amount) {
			await int.reply(text.common.notEnoughBalance);
			return;
		}

		if (amount > 5000) {
			await int.reply("⚠️ Safety tip: Transactions over 5000 are blocked.");
			return;
		}

		await db.userInfo.update({
			where: { id: user.id },
			data: { balance: { decrement: amount } }
		});

		const receiverInfo = await getUserInfo(receiver.id);
		if (!receiverInfo) {
			await int.reply("❌ That user doesn't have a profile yet.");
			return;
		}

		await db.userInfo.update({
			where: { id: receiver.id },
			data: { balance: { increment: amount } },
		});

		await int.reply(`💸 You gave \`${amount}\` to <@${receiver.id}>`);
	});
