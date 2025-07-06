/* eslint-disable no-mixed-spaces-and-tabs */
import { SlashCommandBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Permission } from "../providers/permissions";
import { capitalize } from "../utils/string";

export type CommandExecutor = (interaction: ChatInputCommandInteraction<"cached">) => void | Promise<void>;

const validPermissions = new Set(["admin", "moderator"]);

export type CommandOptionType = Extract<
	keyof SlashCommandBuilder,
	`add${string}Option`
> extends `add${infer U}Option`
	? Lowercase<U>
	: never;

export type CommandOptionArgs<T extends CommandOptionType> = Parameters<
	SlashCommandBuilder[`add${Capitalize<T>}Option`]
>;

export class Command {
	[x: string]: any;
	readonly #slash = new SlashCommandBuilder();
	accessible = true;
	executor: CommandExecutor = i => {
		i.reply("No executor was specified.");
	};
	permissions: Permission[] = [];
	local = false;
	aliases: string[] = [];
	shortcuts: string[] = [];
	syntax: { name: string; type: CommandOptionType; require: boolean }[] = [];
	static disableSlashCommands = false;

	category = "Miscellaneous";

	constructor(
		public readonly name: string,
		public readonly description: string = "",
		options: any = {},
		category?: string
	) {
		this.category = category ?? "Miscellaneous";
		this.#slash
			.setName(this.name)
			.setDescription(this.description)
			.setDefaultPermission(true);
	}

	static disableAllSlashCommands(disable: boolean) {
		this.disableSlashCommands = disable;
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
		const fn = this.#slash[`add${capitalize(type) as Capitalize<T>}Option`].bind(this.#slash) as (...a: typeof args) => void;
		fn(...args);
		return this;
	}

	addNumberOption(name: string, description: string, required: boolean) {
		this.#slash.addNumberOption(option =>
			option.setName(name).setDescription(description).setRequired(required)
		);
		return this;
	}

	addUserOption(...args: Parameters<SlashCommandBuilder["addUserOption"]>) {
		this.#slash.addUserOption(...args);
		return this;
	}

	addStringOption(name: string, description: string, required: boolean) {
		this.#slash.addStringOption(option =>
			option.setName(name).setDescription(description).setRequired(required)
		);
		return this;
	}

	addAttachment<T extends CommandOptionType>(type: T, ...args: CommandOptionArgs<T>) {
		const fn = this.#slash[`add${capitalize(type) as Capitalize<T>}Option`].bind(this.#slash) as (...a: typeof args) => void;
		// fn(...args); // Uncomment if needed
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

	getSubcommand(...args: any[]): any {
		return (this.#slash as any).getSubcommand(...args);
	}

	addPermission(permission: Permission) {
		this.permissions.push(permission);
		return this;
	}

	setLocal(local: boolean) {
		this.local = local;
		return this;
	}

	addShortcuts(...args: string[]) {
		this.shortcuts = this.shortcuts.concat(args);
		return this;
	}

	addAlias(alias: string) {
		this.aliases.push(alias);
		return this;
	}

	addAliases(...args: string[]) {
		this.aliases = this.aliases.concat(args);
		return this;
	}

	addSyntax(name: string, type: CommandOptionType, require = false) {
		this.syntax.push({ name, type, require });
		return this;
	}

	setCategory(category: string) {
		this.category = category;
		return this;
	}

	addPermissionNew(permission: "admin" | "moderator") {
		if (!this.permissionsNew) this.permissionsNew = [];
		if (validPermissions.has(permission)) {
			this.permissionsNew.push(permission);
		}
		return this;
	}

	setData(builderCallback: (builder: SlashCommandBuilder) => SlashCommandBuilder) {
		if (this.slashData) {
			this.slashData = builderCallback(this.slashData);
		}
		return this;
	}

	toJSON() {
		return this.#slash.toJSON();
	}
}
