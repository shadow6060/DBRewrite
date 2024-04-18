import {client} from "../providers/client";
import {commandRegistry} from "../providers/commandManager";
import {text} from "../providers/config";
import {blacklist} from "../database/blacklist";
import {StopCommandExecution} from "../utils/error";
import {ChatInputCommandInteraction} from "discord.js";

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
			if (int.isCommand()) {
				logInteractionAlreadyReplied();
				await int.reply("Error B417");
			}
			return;
		}
		if (int.isCommand()) {
			if (blacklist.has(int.user.id)) {
				logBlacklistedUserInteraction(int.user.id);
				await int.reply(text.errors.blacklisted);
			}
			const command = commandRegistry.get(int.commandName);
			if (!command) throw new Error(`Unregistered command ${int.commandName}`);
			// TODO remove this and use discord builtin when permissions get better
			for (const perm of command.permissions) await perm.check(int);
			// TODO we're assuming this is a ChatInputCommandInteraction, implement other types later.
			if (!(int instanceof ChatInputCommandInteraction)) throw new Error("Unsupported interaction type, please use a chat input command.");
			await command.executor(int as ChatInputCommandInteraction<"cached">);
		}
	} catch (e) {
		if (!(e instanceof StopCommandExecution)) {
			if (int.isCommand()) {
				logException((e as typeof e & {
					message: any
				}).message); // pretend everything is fine and message exists...
				int.reply({ content: text.errors.exception, ephemeral: true }).catch();
			}
			console.error(e);
		}
	}
});
