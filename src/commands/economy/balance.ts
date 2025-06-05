/* eslint-disable linebreak-style */
import { requireUserProfile } from "../../database/userInfo";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("balance", "Check your current balance.")
	.setCategory("💲economy")
	.setExecutor(async (int) => {
		const userId = int.user.id;
		const profile = await requireUserProfile(userId, int);
		if (!profile) return;

		await int.reply(format(text.commands.balance.success, profile.balance));
	});
