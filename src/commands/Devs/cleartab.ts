import { Command } from "../../structures/Command";
import { clearTab } from "../../database/tab";
import { permissions } from "../..//providers/permissions";
import { MessageFlags } from "discord.js";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand({ name: "cleartab", description: "Clear a user's tab (admin only).", local: true })

	.setCategory("🍻tab")
	.addPermission(permissions.developer)
	.addUserOption((opt) => opt.setName("user").setDescription("User to clear").setRequired(true))
	.setExecutor(async (int) => {
		const user = int.options.getUser("user", true);
		const guildId = int.guildId!;

		await clearTab(user.id, guildId);

		await int.reply({
			content: `✅ Cleared tab for ${user.tag}.`,
			flags: MessageFlags.Ephemeral,
		});
	});
