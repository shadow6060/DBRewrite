/* eslint-disable quotes */
import { Message } from "discord.js";
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
export const applicationCommandRegistry = new Collection<string, ApplicationCommand>();

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

// 🔹 Load Slash Commands
const loadSlashCommands = async (): Promise<Command[]> => {
	const commands: Command[] = [];
	const commandFiles = sync(commandFolder);

	for (const file of commandFiles) {
		const module = await import(file);
		const data = module?.command;

		if (!data || typeof data !== "object" || !(data instanceof Command)) {
			throw new Error(`File ${file} does not export a valid Command instance.`);
		}

		if (slashCommandRegistry.has(data.name)) {
			console.warn(`⚠️ Duplicate slash command found: ${data.name}. Skipping...`);
			continue;
		}

		slashCommandRegistry.set(data.name, data);
		commands.push(data);
	}

	return commands;
};

// ⬇ Prefix and extended loaders unchanged ⬇
const loadPrefixCommands = async (): Promise<PrefixCommand[]> => {
	const commands: PrefixCommand[] = [];
	const commandFiles = sync(prefixCommandFolder);
	for (const file of commandFiles) {
		const module = await import(file);
		const data = module?.command;

		if (!data || typeof data !== "object" || !(data instanceof PrefixCommand)) {
			throw new Error(`File ${file} does not export a valid PrefixCommand instance.`);
		}

		if (prefixCommandRegistry.has(data.name)) {
			console.warn(`⚠️ Duplicate prefix command found: ${data.name}. Skipping...`);
			continue;
		}
		commands.push(data);
	}
	return commands;
};

const loadExtendedCommands = async (): Promise<ExtendedCommand[]> => {
	const commands: ExtendedCommand[] = [];
	const commandFiles = sync(extendedCommandFolder);
	for (const file of commandFiles) {
		const module = await import(file);
		const data = module?.command;

		if (!data || typeof data !== "object" || !(data instanceof ExtendedCommand)) {
			throw new Error(`File ${file} does not export a valid ExtendedCommand instance.`);
		}

		if (extendedCommandRegistry.has(data.name)) {
			console.warn(`⚠️ Duplicate extended command found: ${data.name}. Skipping...`);
			continue;
		}
		commands.push(data);
	}
	return commands;
};

// Unregister extended commands from global commands registry
const unregisterExtendedCommandsFromGlobal = async (): Promise<void> => {
	const extendedCommandNames = [...extendedCommandRegistry.keys()];

	for (const name of extendedCommandNames) {
		const command = extendedCommandRegistry.get(name);
		if (command) {
			await rest.delete(Routes.applicationCommand(client.application!.id, command.id));
			extendedCommandRegistry.delete(name);
		}
	}
};

// Register commands
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
		await rest.put(
			Routes.applicationGuildCommands(client.application.id, serverId),
			{ body: serverCommands.map((x) => x.toJSON()) }
		);
	}


	// Populate application command registry
	for (const cmd of (await applicationCommandManager.fetch({})).values()) {
		applicationCommandRegistry.set(cmd.name, cmd);
	}
};

export const loadCommands = async (): Promise<void> => {
	const slashCommands: Command[] = await loadSlashCommands(); // ✅ Now works!
	const extendedCommands: ExtendedCommand[] = await loadExtendedCommands();
	const prefixCommands: PrefixCommand[] = await loadPrefixCommands();

	// 🔹 Store all in registries
	prefixCommands.forEach(cmd => prefixCommandRegistry.set(cmd.name, cmd));
	extendedCommands.forEach(cmd => extendedCommandRegistry.set(cmd.name, cmd));

	// 📝 Logging before registration
	//console.log("───────────── Preparing to Register Commands ─────────────");
	//console.log(`📘 Slash Commands (${slashCommands.length}): ${slashCommands.map(c => c.name).join(", ")}`);
	//console.log(`📗 Extended Commands (${extendedCommands.length}): ${extendedCommands.map(c => c.name).join(", ")}`);
	//console.log(`📕 Prefix Commands (${prefixCommands.length}): ${prefixCommands.map(c => c.name).join(", ")}`);

	// 🔐 Register to Discord
	try {
		await registerCommands([...slashCommands, ...extendedCommands]);
		//console.log("✅ Commands registered successfully.");
	} catch (error) {
		//console.error("❌ Failed to register commands:", error);
	}

	// 🧼 Cleanup: unregister extended from global if needed
	await unregisterExtendedCommandsFromGlobal();

	// ✅ Final logs
	//console.log("───────────── Load Complete ─────────────");

	// Separate registries and log the counts again for each type
	const extendedCommandsCount = extendedCommands.length;
	const slashCommandsCount = slashCommands.length;
	const prefixCommandsCount = prefixCommands.length;

	// Separate commands: log extended and slash ones
	console.log("───────────── Slash Commands ─────────────");
	console.log(`Loaded ${slashCommandsCount}: [${slashCommands.map(cmd => cmd.name).join(", ")}]\n`);

	console.log("───────────── Prefix Commands ─────────────");
	console.log(`Loaded ${prefixCommandsCount}: [${prefixCommands.map(cmd => cmd.name).join(", ")}]\n`);

	// Add Extended Commands to the log
	if (extendedCommandsCount > 0) {
		//console.log(`Moved ${extendedCommandsCount} Extended Commands out of Slash Commands.`);
	}
};
