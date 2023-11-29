import { client } from "../providers/client";
import { commandRegistry } from "../providers/commandManager";
import {constants, text} from "../providers/config";
import { blacklist } from "../database/blacklist";
import { StopCommandExecution } from "../utils/error";
import {LifetimeMap} from "../structures/LifetimeMap";
import type {InteractionByType} from "../utils/components";
import type {Awaitable} from "discord.js";

export const componentCallbacks = new LifetimeMap<string, (int: InteractionByType) => Awaitable<void>>(
	constants.interactionExpiryTimeMs
);

client.on("interactionCreate", async (int) => {
	try {
		if (!int.inCachedGuild()) {
			if (int.isCommand()) int.reply("Error B417");
			return;
		}
		if (int.isCommand()) {
			if (blacklist.has(int.user.id)) {
				await int.reply(text.errors.blacklisted);
			}
			const command = commandRegistry.get(int.commandName);
			if (!command) throw new Error(`Unregistered command ${int.commandName}`);
			// TODO remove this and use discord builtin when permissions get better
			for (const perm of command.permissions) await perm.check(int);
			await command.executor(int);
		}
	} catch (e) {
		if (!(e instanceof StopCommandExecution)) {
			if (int.isCommand()) int.reply({ content: text.errors.exception, ephemeral: true }).catch();
			console.error(e);
		}
	}
});
