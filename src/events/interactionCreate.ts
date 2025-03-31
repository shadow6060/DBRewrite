import { client } from "../providers/client";
import { slashCommandRegistry } from "../providers/commandManager";
import { text } from "../providers/config";
import { blacklist } from "../database/blacklist";
import { StopCommandExecution } from "../utils/error";
import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../structures/Command";

client.on("interactionCreate", async (interaction) => {
	try {
		if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) {
			if (interaction.isChatInputCommand()) await interaction.reply("Error B417");
			return;
		}

		if (blacklist.has(interaction.user.id)) {
			await interaction.reply(text.errors.blacklisted);
			console.log(`User is blacklisted: ${interaction.user.id}`);
			return;
		}

		const command = slashCommandRegistry.get(interaction.commandName);

		// Ensure it's a valid slash command
		if (!command || !(command instanceof Command)) {
			throw new Error(`Unregistered or invalid slash command: ${interaction.commandName}`);
		}

		// Check permissions
		for (const perm of command.permissions) await perm.check(interaction);

		// Execute the command
		await command.executor(interaction as ChatInputCommandInteraction<"cached">);
	} catch (e) {
		if (!(e instanceof StopCommandExecution)) {
			console.error(e);
			if (interaction.isChatInputCommand()) {
				await interaction.reply({ content: text.errors.exception, ephemeral: true });
			}
		}
	}
});
