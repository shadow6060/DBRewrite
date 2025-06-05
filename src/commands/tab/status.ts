import { Command } from "../../structures/Command";
import { getTabStatus } from "../../database/tab";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand({ name: "status", description: "Check your current bar tab.", local: true })
	.setCategory("🍻tab")
	.setExecutor(async (int) => {
		const userId = int.user.id;
		const guildId = int.guildId!;

		const tab = await getTabStatus(userId, guildId);

		if (!tab) {
			await int.reply({
				content: "You don't have a tab yet. Order something first!",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle("📊 Your Tab Status")
			.setColor(0xf39c12)
			.addFields(
				{ name: "Amount Owed", value: `$${tab.amount.toFixed(2)}`, inline: true },
				{ name: "Limit", value: `$${tab.maxLimit.toFixed(2)}`, inline: true },
				{ name: "Blocked", value: tab.isBlocked ? "🚫 Yes" : "✅ No", inline: true },
				{ name: "Last Paid", value: tab.lastPaidAt ? `<t:${Math.floor(new Date(tab.lastPaidAt).getTime() / 1000)}:R>` : "Never" }
			);

		await int.reply({ embeds: [embed], ephemeral: true });
	});
