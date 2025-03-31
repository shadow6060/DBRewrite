import { Message, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../structures/Command";
import { PrefixCommand } from "../structures/prefixCommand"; // ✅ Correct casing

export const executeCommand = async (
	command: Command | PrefixCommand,
	messageOrInteraction: Message | ChatInputCommandInteraction<"cached">,
	args: string[] = []
) => {
	try {
		if (command instanceof PrefixCommand) {
			if (messageOrInteraction instanceof Message) {
				await command.execute(messageOrInteraction, args);
			} else {
				console.warn(`PrefixCommand '${(command as PrefixCommand).name}' was executed with an interaction.`);
			}
		} else if (command instanceof Command) {
			if (messageOrInteraction instanceof ChatInputCommandInteraction) {
				await command.executor(messageOrInteraction);
			} else {
				console.warn(`SlashCommand '${(command as Command).name}' was executed with a message.`);
			}
		} else {
			console.warn("Unknown command type for execution.");
		}
	} catch (error) {
		console.error(`Error executing command '${command instanceof Command ? command.name : "unknown"}':`, error);
	}
};
