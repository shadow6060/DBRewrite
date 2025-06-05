import { client } from "../providers/client";
import { slashCommandRegistry } from "../providers/commandManager";
import { text } from "../providers/config";
import { blacklist } from "../database/blacklist";
import { StopCommandExecution } from "../utils/error";
import { ChatInputCommandInteraction } from "discord.js"; // Make sure you're importing the correct types
import { Command } from "../structures/Command";

client.on("interactionCreate", async (interaction) => {
	try {
		// Check if the interaction is a chat input command and from a cached guild
		if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) {
			if (interaction.isChatInputCommand()) {
				// Respond with a specific error if the interaction is a command but not from a cached guild
				await interaction.reply("Error B417");
			}
			return;
		}

		// Check if the user is blacklisted
		if (blacklist.has(interaction.user.id)) {
			await interaction.reply(text.errors.blacklisted);
			console.log(`User is blacklisted: ${interaction.user.id}`);
			return;
		}

		// Retrieve the command from the registry
		const command = slashCommandRegistry.get(interaction.commandName);

		// Ensure the command is valid and of type Command
		if (!command || !(command instanceof Command)) {
			throw new Error(`Unregistered or invalid slash command: ${interaction.commandName}`);
		}

		// Check permissions, assuming it's an array
		if (Array.isArray(command.permissions)) {
			for (const perm of command.permissions) {
				await perm.check(interaction);
			}
		}

		// Execute the command (cast to the correct type)
		await command.executor(interaction as ChatInputCommandInteraction<"cached">);

	} catch (e) {
		// Handle errors, excluding StopCommandExecution to prevent unnecessary logging
		if (e instanceof StopCommandExecution) {
			// The command explicitly stops execution
			return;
		}

		// General error handling
		console.error(e);
		if (interaction.isChatInputCommand()) {
			await interaction.reply({ content: text.errors.exception, ephemeral: true });
		}
	}
});
