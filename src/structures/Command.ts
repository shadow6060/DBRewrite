import {SlashCommandBuilder} from "@discordjs/builders";
import type {CommandInteraction} from "discord.js";
import type {Permission} from "../providers/permissions";
import {capitalize} from "../utils/string";
import {ChatInputCommandInteraction} from "discord.js";

/** A command executor. Either returns void or a promise that resolves to void. */
export type CommandExecutor = (int: ChatInputCommandInteraction<"cached">) => void | Promise<void>;

/** An option that can be added to a command. */
export type CommandOptionType = Extract<
	keyof SlashCommandBuilder,
	`add${string}Option`
> extends `add${infer U}Option`
	? Lowercase<U>
	: never;

/**
 * Type definition for the arguments of a command option.
 * @example
 * // If T is "string", this type will be equivalent to the parameters of the `addStringOption` method in SlashCommandBuilder.
 * type StringOptionArgs = CommandOptionArgs<"string">;
 */
export type CommandOptionArgs<T extends CommandOptionType> = Parameters<SlashCommandBuilder[`add${Capitalize<T>}Option`]>;
type StringOptionArgs = CommandOptionArgs<"string">;

/**
 * Represents a command.
 * @example
 * const command = new Command("ping", "Replies with pong!");
 * command.setExecutor(i => i.reply("Pong!"));
 */
export class Command {
	accessible = true;
	permissions: Permission[] = [];
	local = false;
	aliases: string[] = [];
	shortcuts: string[] = [];
	syntax: { name: string; type: CommandOptionType; require: boolean }[] = [];
	readonly #slash = new SlashCommandBuilder();

	/**
	 * Creates a new command.
	 * @param name - The name of the command.
	 * @param description - The description of the command.
	 */
	constructor(public readonly name: string, public readonly description = "") {
		this.#slash.setName(this.name).setDescription(this.description).setDefaultPermission(true);
	}

	executor: CommandExecutor = i => {
		i.reply("No executor was specified.");
	};

	/**
	 * Sets the command to be accessible by default or not.
	 * @param accessible - Whether the command is accessible by default.
	 */
	setAccessible(accessible: boolean) {
		this.accessible = accessible;
		this.#slash.setDefaultPermission(accessible);
		return this;
	}

	/**
	 * Sets the executor of the command.
	 * @param executor - The executor of the command, a function that doesn't return or returns a promise that resolves to void.
	 */
	setExecutor(executor: CommandExecutor) {
		this.executor = executor;
		return this;
	}

	/**
	 * Adds an option to the command.
	 * @param type - The type of the option.
	 * @param args - Arguments for the option.
	 * @example
	 * command.addOption("string", o => o.setName("name").setDescription("The name of the user"));
	 */
	addOption<T extends CommandOptionType>(type: T, ...args: CommandOptionArgs<T>) {
		const fn = this.#slash[`add${capitalize(type) as Capitalize<T>}Option`].bind(this.#slash) as (...a: typeof args) => void;
		fn(...args);
		return this;
	}

	/**
	 * Adds an attachment to the command.
	 * @alias addOption
	 * @param type - The type of the attachment.
	 * @param args - Arguments for the attachment.
	 * @example
	 * command.addAttachment("string", o => o.setName("name").setDescription("The name of the user"));
	 */
	addAttachment<T extends CommandOptionType>(type: T, ...args: CommandOptionArgs<T>) {
		const fn = this.#slash[`add${capitalize(type) as Capitalize<T>}Option`].bind(this.#slash) as (...a: typeof args) => void;
		fn(...args);
		return this;
	}

	/**
	 * Adds a subcommand to the command.
	 * @param args - Arguments for the subcommand.
	 * @example
	 * command.addSubCommand(o => o.setName("subcommand").setDescription("A subcommand"));
	 */
	addSubCommand(...args: Parameters<SlashCommandBuilder["addSubcommand"]>) {
		this.#slash.addSubcommand(...args);
		return this;
	}

	/**
	 * Adds a subcommand group to the command.
	 * @param args - Arguments for the subcommand group.
	 */
	addSubcommandGroup(...args: Parameters<SlashCommandBuilder["addSubcommandGroup"]>) {
		this.#slash.addSubcommandGroup(...args);
		return this;
	}

	/**
	 * Adds a permission to the command.
	 * @param permission - The permission to add.
	 */
	addPermission(permission: Permission) {
		this.permissions.push(permission);
		return this;
	}

	/**
	 * Sets the command to be local or not.
	 * @param local - Whether the command is local.
	 */
	setLocal(local: boolean) {
		this.local = local;
		return this;
	}

	/**
	 * Adds a shortcut to the command.
	 * @param args - The shortcuts to add.
	 */
	addShortcuts(...args: string[]) {
		this.shortcuts = this.shortcuts.concat(args);
		return this;
	}

	/**
	 * Adds an alias to the command.
	 * @param alias = The alias to add.
	 */
	addAlias(alias: string) {
		this.aliases.push(alias);
		return this;
	}

	/**
	 * Adds aliases to the command.
	 * @param args - The aliases to add.
	 * @example
	 * command.addAliases("ping", "pong");
	 */
	addAliases(...args: string[]) {
		this.aliases = this.aliases.concat(args);
		return this;
	}

	/**
	 * Adds syntax to the command.
	 * @param name - The name of the syntax.
	 * @param type - The type of the syntax.
	 * @param require - Whether the syntax is required. Defaults to `false`.
	 * @example
	 * command.addSyntax("name", "string", true);
	 */
	addSyntax(name: string, type: CommandOptionType, require = false) {
		this.syntax.push({name, type, require});
		return this;
	}

	/**
	 * Converts the command to a JSON object.
	 */
	toJSON() {
		return this.#slash.toJSON();
	}
}