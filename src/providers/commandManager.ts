/* eslint-disable quotes */
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
import { ExtendedCommand } from "../structures/extendedCommand";
import { mainGuild } from "./discord";

const commandFolder = join(__dirname, "../commands/**/*.js").replaceAll(win32.sep, posix.sep);
const questCommandFolder = join(__dirname, "../quests/**/*.js").replaceAll(win32.sep, posix.sep); // Updated folder for quest commands
const extendedCommandFolder = join(__dirname, "../extendedCommands/**/*.js").replaceAll(win32.sep, posix.sep);

export const commandRegistry = new Collection<string, Command | ExtendedCommand>();
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

// Modify the registerCommands function to handle both Command and ExtendedCommand
const registerCommands = async (commands: (Command | ExtendedCommand)[]) => {
	if (!client.isReady()) throw new Error("registerCommands called before client was ready.");
	applicationCommandManager = development ? mainGuild.commands : client.application!.commands;

	const globalCommands = commands.filter((x) => !(x instanceof ExtendedCommand && x.local));
	const localCommands = commands.filter((x) => x instanceof ExtendedCommand && x.local);
	const serverCommands = commands.filter((x) => x instanceof ExtendedCommand && x.servers); // New line for server commands

	// Register global commands
	await rest.put(Routes.applicationCommands(client.application.id), { body: globalCommands.map((x) => x.toJSON()) });

	// Register local commands for the main server
	await rest.put(Routes.applicationGuildCommands(client.application.id, config.mainServer), {
		body: localCommands.map((x) => x.toJSON()),
	});

	// Register server commands for specific servers
	for (const serverId of Object.values(config.servers)) {
		const serverName = "TestServer"; // Replace this with the name of the server
		await rest.put(Routes.applicationGuildCommands(client.application.id, serverId), {
			body: serverCommands.map((x) => x.toJSON()),
		});
		console.log(`Registered local commands for ${serverName}: ${serverCommands.map((x) => x.name).join(", ")}`); // Log the loaded commands for the server
	}

	commands.forEach((x) => commandRegistry.set(x.name, x));
	for (const cmd of (await applicationCommandManager.fetch({})).values()) {
		applicationCommandRegistry.set(cmd.name, cmd);
	}

	// Display "Local" for local commands
	console.log(`Registered local commands for the main server: ${localCommands.map((x) => x.name).join(", ")}`);
};

const commandNames: string[] = [];

export const loadCommands = async (): Promise<(Command | ExtendedCommand)[]> => {
	const commands: (Command | ExtendedCommand)[] = []; // Ensure commands array is of type Command or ExtendedCommand

	// Load standard commands
	const commandFiles = sync(commandFolder);
	for (const file of commandFiles) {
		const data = (await import(file)) as { command: Command | ExtendedCommand }; // Load as Command or ExtendedCommand
		if (!(data.command instanceof Command || (data.command as any) instanceof ExtendedCommand)) {
			throw new Error(`File ${file} does not export 'command'.`);
		}
		if (commandNames.includes(data.command.name)) {
			console.log(`Duplicate command name found: ${data.command.name}. Skipping...`);
			continue;
		} else commandNames.push(data.command.name);
		console.log(`Registered command ${basename(file, ".js")}.`);
		commands.push(data.command);
	}

	// Load quest commands
	const questCommandFiles = sync(questCommandFolder);
	for (const file of questCommandFiles) {
		const data = (await import(file)) as { command: Command | ExtendedCommand }; // Load as Command or ExtendedCommand
		if (!(data.command instanceof Command || (data.command as any) instanceof ExtendedCommand)) {
			throw new Error(`File ${file} does not export 'command'.`);
		}
		if (commandNames.includes(data.command.name)) {
			console.log(`Duplicate command name found: ${data.command.name}. Skipping...`);
			continue;
		} else commandNames.push(data.command.name);
		console.log(`Registered quest command ${basename(file, ".js")}.`);
		commands.push(data.command);
	}

	const extendedCommands = await loadExtendedCommands();
	commands.push(...extendedCommands);

	await registerCommands(commands);
	return commands;
};

// Define a new function to load ExtendedCommands
const loadExtendedCommands = async (): Promise<ExtendedCommand[]> => {
	const commands: ExtendedCommand[] = [];
	const commandFiles = sync(extendedCommandFolder);
	for (const file of commandFiles) {
		const data = (await import(file)) as { command: ExtendedCommand };
		if (!(data.command instanceof ExtendedCommand)) throw new Error(`File ${file} does not export 'command'.`);
		console.log(`Registered extended command ${basename(file, ".js")}.`);
		commands.push(data.command);
	}
	return commands;
};
