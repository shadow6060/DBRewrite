import type { Message } from "discord.js";
import { prefixCommandRegistry } from "../providers/commandManager"; // Ensure this path is correct
import { config } from "../providers/config"; // Prefix stored here

export async function handlePrefixCommand(message: Message) {
	if (message.author.bot) return;

	const prefix = config.prefix;
	if (!message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift()?.toLowerCase();
	if (!commandName) return;

	// Look for the command using the main command name or any alias
	const command = Array.from(prefixCommandRegistry.values()).find(cmd =>
		cmd.isAlias(commandName)
	);

	if (!command) {
		await message.reply(`Unknown command: \`${commandName}\``);
		return;
	}

	try {
		await command.execute(message, args);
	} catch (error) {
		console.error(`Error executing prefix command '${commandName}':`, error);
		await message.reply("There was an error executing the command.");
	}
}
