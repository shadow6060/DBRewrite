import { EmbedBuilder } from "discord.js";
import { ExtendedCommand } from "../../structures/extendedCommand";
import { isManualMode } from "../../utils/MysticUtils/settings";
import { permissions } from "../../providers/permissions"; // Import your permissions
import { config } from "../../providers/config";

export const command = new ExtendedCommand(
	{
		name: "manualcheck",
		description: "Check the current manual mode status.",servers: [config.servers.local],
		local: true
	}
)
	.addPermission(permissions.developer) // Restrict this command to devs only
	.setCategory("🔐 Devs")
	.setExecutor(async (int) => {
		const manualMode = await isManualMode();

		// Create a simple response based on the status
		const statusMessage = manualMode
			? "The system is currently in **manual mode**."
			: "The system is currently in **automatic mode**.";

		const embed = new EmbedBuilder()
			.setTitle("Manual Mode Status")
			.setDescription(statusMessage)
			.setColor(manualMode ? 0x8e44ad : 0x3498db) // Purple for manual, blue for automatic
			.setTimestamp();

		await int.reply({ embeds: [embed] });
	});
