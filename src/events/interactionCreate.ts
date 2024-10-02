import { client } from "../providers/client";
import { commandRegistry } from "../providers/commandManager";
import { text } from "../providers/config";
import { blacklist } from "../database/blacklist";
import { StopCommandExecution } from "../utils/error";
import { ChatInputCommandInteraction } from "discord.js";

// Custom logging functions
function logInteractionAlreadyReplied() {
	console.log("The reply to this interaction has already been sent or deferred.");
}

function logBlacklistedUserInteraction(userId: string) {
	console.log(`Interaction failed due to user being blacklisted: ${userId}`);
}

function logException(message: string) {
	console.log(`Interaction failed with exception: ${message}`);
}


client.on("interactionCreate", async (int) => {
	try {
		if (!int.inCachedGuild()) {
			if (int.isCommand()) await int.reply("Error B417");
			return;
		}

		if (int.isCommand()) {
			if (blacklist.has(int.user.id)) {
				await int.reply(text.errors.blacklisted);
				return; // Return after replying to prevent further execution
			}

			const command = commandRegistry.get(int.commandName);
			if (!command) throw new Error(`Unregistered command ${int.commandName}`);

			// TODO remove this and use Discord's built-in permissions when permissions get better
			for (const perm of command.permissions) await perm.check(int);

			await command.executor(int as ChatInputCommandInteraction<"cached">);
		}
	} catch (e) {
		if (!(e instanceof StopCommandExecution)) {
			if (int.isCommand()) await int.reply({ content: text.errors.exception, ephemeral: true });
			console.error(e);
		}
	}
});
