import type { ApplicationCommandPermissionData, CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { capitalize } from "../utils/string";
import type { Permission } from "../providers/permissions";

export type CommandExecutor = (interaction: CommandInteraction<"cached">) => void | Promise<void>;

export type CommandOptionType = Extract<
	keyof SlashCommandBuilder,
	`add${string}Option`
> extends `add${infer U}Option`
	? Lowercase<U>
	: never;
export type CommandOptionArgs<T extends CommandOptionType> = Parameters<SlashCommandBuilder[`add${Capitalize<T>}Option`]>;

export class Command {
	readonly #slash = new SlashCommandBuilder();
	accessible = true;
	executor: CommandExecutor = i => i.reply("No executor was specified.");
	permissions: Permission[] = [];
	local = false;

	constructor(public readonly name: string, public readonly description = "") {
		this.#slash.setName(this.name).setDescription(this.description).setDefaultPermission(true);

	}

	setAccessible(accessible: boolean) {
		this.accessible = accessible;
		this.#slash.setDefaultPermission(accessible);
		return this;
	}

	setExecutor(executor: CommandExecutor) {
		this.executor = executor;
		return this;
	}

	addOption<T extends CommandOptionType>(type: T, ...args: CommandOptionArgs<T>) {
		const fn = this.#slash[`add${capitalize(type)}Option`].bind(this.#slash) as (...a: typeof args) => void;
		fn(...args);
		return this;
	}

	addSubCommand(...args: Parameters<SlashCommandBuilder["addSubcommand"]>) {
		this.#slash.addSubcommand(...args);
		return this;
	}

	addSubcommandGroup(...args: Parameters<SlashCommandBuilder["addSubcommandGroup"]>) {
		this.#slash.addSubcommandGroup(...args);
		return this;
	}

	addPermission(permission: Permission) {
		this.permissions.push(permission);
		return this;
	}

	setLocal(local: boolean) {
		this.local = local;
		return this;
	}

	readonly toJSON: SlashCommandBuilder["toJSON"] = this.#slash.toJSON.bind(this.#slash);
}