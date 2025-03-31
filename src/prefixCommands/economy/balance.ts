/* eslint-disable linebreak-style */
import { getUserInfo } from "../../database/userInfo";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";

export const command = new PrefixCommand("balance", "Checks your balance.")
	.setCategory("economy")
	.setPrefixExecutor(async (message) => {
		const info = await getUserInfo(message.author);
		const balance = info?.balance ?? 0;

		const replyMessage = format(text.commands.balance.success, balance);
		await message.reply(replyMessage);
	});
