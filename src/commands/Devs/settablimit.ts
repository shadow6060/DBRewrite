import { Command } from "../../structures/Command";
import { updateTabLimit } from "../../database/tab";
import { MessageFlags, PermissionFlagsBits } from "discord.js";
import { permissions } from "../../providers/permissions";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand({ name: "settablimit", description: "Set a user's tab limit (admin only)", local: true })
	.setCategory("🍻tab")
	.addPermission(permissions.developer)
	.addUserOption((opt) => opt.setName("user").setDescription("User to update").setRequired(true))
	.addNumberOption("amount", "New limit amount", true)
	.setExecutor(async (int) => {
		const user = int.options.getUser("user", true);
		const newLimit = int.options.getNumber("amount", true);
		const guildId = int.guildId!;

		await updateTabLimit(user.id, guildId, newLimit);

		await int.reply({
			content: `✅ Set new tab limit for ${user.tag} to $${newLimit.toFixed(2)}.`,
			flags: MessageFlags.Ephemeral,
		});
	});
 