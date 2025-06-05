import { ExtendedCommand } from "../../structures/extendedCommand";
import { isManualMode, setManualMode } from "../../structures/settings"; // adjust path if needed
import { permissions } from "../../providers/permissions"; // your existing permission system
import { config } from "../../providers/config";
import { MessageFlags } from "discord.js";

export const command = new ExtendedCommand({
	name: "manualmode",
	description: "Toggle manual order processing mode (admin/mod only).",
	local: true,
	servers: [config.servers.local],  // Server(s) where the command is active
})
	.addPermission(permissions.developer) // Permission for the command (moderator level)
	.setExecutor(async (interaction) => {
		// Get the current manual mode state
		const currentState = await isManualMode();
		const newState = !currentState;  // Toggle the current state

		// Set the new manual mode state
		await setManualMode(newState);

		// Respond to the interaction
		await interaction.reply({
			content: `🛠️ Manual mode is now **${newState ? "enabled" : "disabled"}**.\n${newState
				? "Manual mode is now enabled. Time for hands-on work! ☕"
				: "Automation mode is back. Let the robots handle it. 🤖"
			}`,
			flags: MessageFlags.Ephemeral,
		});
	});
