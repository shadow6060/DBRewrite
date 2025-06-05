import { Command } from "../../structures/Command";
import { getOrCreateTab, clearTab, addToTab } from "../../database/tab";
import { getUserBalance, updateBalance } from "../../database/userInfo";
import {
	ChatInputCommandInteraction,
	CommandInteraction,
	CommandInteractionOptionResolver,
	MessageFlags,
} from "discord.js";
import { config } from "../../providers/config";

export const command = new Command("paytab", "Pay off or reduce your tab.")
	.setCategory("🍻tabs")
	.setExecutor(async (int: ChatInputCommandInteraction) => {
		const userId = int.user.id;
		const guildId = int.guildId!;
		const amountToPay = int.options.getNumber("amount", true);
		const tab = await getOrCreateTab(userId, guildId);
		const { balance } = await getUserBalance(userId);

		if (tab.isBlocked) {
			const timeSinceLastPaid = Date.now() - new Date(tab.lastPaidAt!).getTime();
			if (timeSinceLastPaid > config.tabConfig.paymentGracePeriod) {
				await int.reply({
					content: `❌ Your tab has been blocked for exceeding the grace period of ${config.tabConfig.paymentGracePeriod / 1000 / 3600} hours. Please pay off your tab to proceed.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		}

		if (tab.amount >= config.tabConfig.maxLimit) {
			await int.reply({
				content: `❌ You’ve reached the maximum tab amount of **$${config.tabConfig.maxLimit.toFixed(2)}**. Please pay it off before ordering more drinks.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (balance < amountToPay) {
			await int.reply({
				content: `❌ You don't have enough funds. Your balance is **$${balance.toFixed(2)}**, but you tried to pay **$${amountToPay.toFixed(2)}**.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (amountToPay >= tab.amount) {
			await updateBalance(userId, balance - tab.amount);
			await clearTab(userId, guildId);
			await int.reply({
				content: `💰 You’ve successfully paid off your tab of **$${tab.amount.toFixed(2)}**. Thank you!`,
			});
		} else {
			const remaining = tab.amount - amountToPay;
			await updateBalance(userId, balance - amountToPay);
			await addToTab(userId, guildId, -amountToPay);
			await int.reply({
				content:
					`⚠️ You’ve paid **$${amountToPay.toFixed(2)}** toward your tab.\n` +
					`You still owe **$${remaining.toFixed(2)}**.\n` +
					`Please pay the remaining balance within the next **${config.tabConfig.paymentGracePeriod / 1000 / 3600} hours** to avoid being blocked.`,
			});
		}
	})
	.addNumberOption("amount", "Amount to pay toward your tab", true);
