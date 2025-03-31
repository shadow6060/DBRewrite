/* eslint-disable quotes */
import { Message } from "discord.js"; // Import Message type
import { basename, join, posix, win32 } from "path";
import { sync } from "fast-glob";
import { Command } from "../structures/Command";
import { Routes } from "discord-api-types/v10";
import { client, rest } from "./client";
import { development } from "./env";
import { config } from "./config";
import type {
	ApplicationCommand,
	ApplicationCommandManager,
	GuildApplicationCommandManager,
	GuildResolvable,
} from "discord.js";
import { Collection } from "discord.js";
import { notInitialized } from "../utils/utils";
import "./permissions";
import { mainGuild } from "./discord";
import { ExtendedCommand } from "../structures/extendedCommand";
import { PrefixCommand } from "../structures/prefixCommand";

// Define paths to command folders
const commandFolder = join(__dirname, "../commands/**/*.js").replaceAll(win32.sep, posix.sep);
const prefixCommandFolder = join(__dirname, "../prefixCommands/**/*.js").replaceAll(win32.sep, posix.sep);
const extendedCommandFolder = join(__dirname, "../extendedCommands/**/*.js").replaceAll(win32.sep, posix.sep);

// Separate registries for different command types
export const prefixCommandRegistry = new Collection<string, PrefixCommand>();
export const slashCommandRegistry = new Collection<string, Command>();
export const extendedCommandRegistry = new Collection<string, ExtendedCommand>();
export const applicationCommandRegistry = new Collection<string, ApplicationCommand>(); // For stored Discord slash commands

export let applicationCommandManager:
	| GuildApplicationCommandManager
	| ApplicationCommandManager<
		ApplicationCommand<{
			guild: GuildResolvable;
		}>,
		{
			guild: GuildResolvable;
		},
		null
	> = notInitialized("applicationCommandManager");

const registerCommands = async (commands: (Command | ExtendedCommand)[]) => {
	if (!client.isReady()) throw new Error("registerCommands called before client was ready.");
	applicationCommandManager = development ? mainGuild.commands : client.application!.commands;

	const globalCommands = commands.filter((x) => !(x instanceof ExtendedCommand && x.local));
	const localCommands = commands.filter((x) => x instanceof ExtendedCommand && x.local);
	const serverCommands = commands.filter((x) => x instanceof ExtendedCommand && x.servers);

	// Register global commands
	await rest.put(Routes.applicationCommands(client.application.id), { body: globalCommands.map((x) => x.toJSON()) });

	// Register local commands for the main server
	await rest.put(Routes.applicationGuildCommands(client.application.id, config.mainServer), {
		body: localCommands.map((x) => x.toJSON()),
	});

	// Register server commands for specific servers
	for (const serverId of Object.values(config.servers)) {
		await rest.put(Routes.applicationGuildCommands(client.application.id, serverId), {
			body: serverCommands.map((x) => x.toJSON()),
		});
	}

	// Populate application command registry
	for (const cmd of (await applicationCommandManager.fetch({})).values()) {
		applicationCommandRegistry.set(cmd.name, cmd);
	}
};

export const loadCommands = async (): Promise<void> => {
	const slashCommands: Command[] = [];
	const prefixCommands = await loadPrefixCommands(); // ✅ Load prefix commands
	const extendedCommands = await loadExtendedCommands(); // ✅ Load extended commands

	// 🔹 Load Slash Commands
	const commandFiles = sync(commandFolder);
	for (const file of commandFiles) {
		const module = await import(file);
		const data = module?.command;

		if (!data || typeof data !== "object" || !(data instanceof Command)) {
			throw new Error(`File ${file} does not export a valid Command instance.`);
		}

		if (slashCommandRegistry.has(data.name)) {
			console.warn(`Duplicate slash command found: ${data.name}. Skipping...`);
			continue;
		}
		slashCommandRegistry.set(data.name, data);
		slashCommands.push(data);
	}

	// 🔹 Store prefix and extended commands in their registries
	prefixCommands.forEach(cmd => prefixCommandRegistry.set(cmd.name, cmd));
	extendedCommands.forEach(cmd => extendedCommandRegistry.set(cmd.name, cmd));

	// 🔹 Register commands with Discord API
	await registerCommands([...slashCommands, ...extendedCommands]);

	// 🚀 FINAL SUMMARY LOG (Newly Added)
	console.log(`Loaded ${slashCommands.length} Slash Commands: [${slashCommands.map(cmd => cmd.name).join(", ")}]`); // Slash Commands
	console.log(`Loaded ${prefixCommands.length} Prefix Commands: [${prefixCommands.map(cmd => cmd.name).join(", ")}]`); // Prefix Commands
	console.log(`Loaded ${extendedCommands.length} Extended Commands: [${extendedCommands.map(cmd => cmd.name).join(", ")}]`); // Extended Commands

};

// Load prefix commands
const loadPrefixCommands = async (): Promise<PrefixCommand[]> => {
	const commands: PrefixCommand[] = [];
	const commandFiles = sync(prefixCommandFolder);

	for (const file of commandFiles) {
		const module = await import(file);
		const data = module?.command;

		// Ensure the command is an instance of PrefixCommand
		if (!data || typeof data !== "object" || !(data instanceof PrefixCommand)) {
			throw new Error(`File ${file} does not export a valid PrefixCommand instance.`);
		}

		// Store the command in prefix registry
		if (prefixCommandRegistry.has(data.name)) {
			console.warn(`Duplicate prefix command found: ${data.name}. Skipping...`);
			continue;
		}

		// Register the main command name
		prefixCommandRegistry.set(data.name, data);

		// Register aliases (if any)
		for (const alias of data.aliases) {
			if (prefixCommandRegistry.has(alias)) {
				console.warn(`Duplicate alias found: ${alias}. Skipping...`);
			} else {
				// Store the alias in the registry
				prefixCommandRegistry.set(alias, data);
			}
		}

		commands.push(data);
	}

	return commands;
};


// Load extended commands
const loadExtendedCommands = async (): Promise<ExtendedCommand[]> => {
	const commands: ExtendedCommand[] = [];
	const commandFiles = sync(extendedCommandFolder);
	for (const file of commandFiles) {
		const module = await import(file);
		const data = module?.command;

		if (!data || typeof data !== "object" || !(data instanceof ExtendedCommand)) {
			throw new Error(`File ${file} does not export a valid ExtendedCommand instance.`);
		}

		// Store in extended registry
		if (extendedCommandRegistry.has(data.name)) {
			console.warn(`Duplicate extended command found: ${data.name}. Skipping...`);
			continue;
		}
		extendedCommandRegistry.set(data.name, data);
		commands.push(data);
	}
	return commands;
};
