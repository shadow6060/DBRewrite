import type { Message } from "discord.js";
import { prefixCommandRegistry } from "../providers/commandManager";
import { config } from "../providers/config";
import { PrefixCommand } from "../structures/prefixCommand"; // ✅ Correct casing
import { permissions } from "../providers/permissions"; // Import permissions

const prefix = config.prefix;

export const messageCreateHandler = async (message: Message) => {
	if (message.author.bot || !message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).trim().split(/\s+/);
	const commandName = args.shift()?.toLowerCase();
	if (!commandName) return;

	const command = prefixCommandRegistry.get(commandName);

	// Check if command exists
	if (command instanceof PrefixCommand) {
		// 🔹 Check for permissions before executing
		for (const permission of command.permissions) {
			if (!(await permission.hasPermission(message.author))) {
				await message.reply("❌ You don't have permission to use this command.");
				return;
			}
		}

		// Execute command if user has permission
		await command.execute(message, args);
	} else {
		console.log(`Command not found: ${commandName}`);
	}
};
