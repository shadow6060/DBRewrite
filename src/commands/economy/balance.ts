/* eslint-disable linebreak-style */
import {getUserInfo} from "../../database/userInfo";
import {text} from "../../providers/config";
import {Command} from "../../structures/Command";
import {format} from "../../utils/string";

export const command = new Command("balance", "Checks your balance.")
	.setExecutor(async int => {
		const info = await getUserInfo(int.user);
		const balance = info?.balance ?? 0;
		//const donuts = info?.donuts ?? 0;
		const replyMessage = format(text.commands.balance.success, balance); //+ "\n" +
		//format(text.commands.balance.success1, donuts);
		await int.reply(replyMessage);
	});
