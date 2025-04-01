/* eslint-disable linebreak-style */
import { db } from "../../database/database";
import { getUserInfo } from "../../database/userInfo";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("balance", "Checks your balance.")
	.setExecutor(async int => {
		// Ensure user exists in the database
		let info = await getUserInfo(int.user.id);
		if (!info) {
			await db.userInfo.create({
				data: { id: int.user.id, balance: 0, donuts: 0 }
			});
			info = (await getUserInfo(int.user.id))!; // Ensure it's not null
		}

		const balance = info.balance;
		//const donuts = info.donuts;
		const replyMessage = format(text.commands.balance.success, balance); //+ "\n" +
		//format(text.commands.balance.success1, donuts);

		await int.reply(replyMessage);
	});
