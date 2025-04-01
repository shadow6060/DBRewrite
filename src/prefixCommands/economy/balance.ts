/* eslint-disable linebreak-style */
import { db } from "../../database/database";
import { getUserInfo } from "../../database/userInfo";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";

export const command = new PrefixCommand("balance", "Checks your balance.")
	.setCategory("economy")
	.setPrefixExecutor(async (message) => {
		let info = await getUserInfo(message.author.id);

		// Ensure user exists in database
		if (!info) {
			await db.userInfo.create({
				data: { id: message.author.id, balance: 0, donuts: 0 }
			});
			info = (await getUserInfo(message.author.id))!;
		}

		const balance = info.balance;
		const replyMessage = format(text.commands.balance.success, balance);
		await message.reply(replyMessage);
	});
