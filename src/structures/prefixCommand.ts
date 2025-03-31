import type { Message, User } from "discord.js";
import { Command } from "./Command"; // Base Command class
import type { Permission } from "../providers/permissions";

// Define the type for command options
type Option = {
	type: "string" | "integer" | "user";  // You can add more types if needed
	required: boolean;
};

export type PrefixCommandExecutor = (message: Message, args: string[], options: Record<string, any>) => void | Promise<void>;

export class PrefixCommand extends Command {
	private prefixExecutor: PrefixCommandExecutor = async (message, args, options) => {
		await message.reply("No executor was specified.");
	};

	permissions: Permission[] = [];
	options: Record<string, Option> = {};  // Store the command options (string, integer, user, etc.)
	aliases: string[] = [];  // To store aliases for the command
	category: string;  // Category for grouping commands

	constructor(name: string, description = "", options: any = {}, aliases: string[] = [], category = "Miscellaneous") {
		super(name, description, options);
		this.aliases = aliases;  // Store aliases in the class
		this.category = category;  // Set the category for the command
	}

	// Set the executor for prefix commands
	setPrefixExecutor(executor: PrefixCommandExecutor) {
		this.prefixExecutor = executor;
		return this;
	}

	// Add permission requirement
	addPermission(permission: Permission) {
		this.permissions.push(permission);
		return this;
	}

	// Add options (integer, string, user, etc.)
	addOptions(type: "integer" | "string", option: { name: string; description: string; required?: boolean }) {
		this.options[option.name] = { type, required: option.required ?? false };
		return this;
	}

	// Add user option
	addUserOptions(option: { name: string; description: string; required?: boolean }) {
		this.options[option.name] = { type: "user", required: option.required ?? false };
		return this;
	}

	// Set the category of the command
	setCategory(category: string) {
		this.category = category;
		return this;
	}

	// Add an alias to the command
	addAlias(alias: string) {
		if (!this.aliases.includes(alias)) {
			this.aliases.push(alias);
		}
		return this;
	}

	// Execute with permission and options parsing
	async execute(message: Message, args: string[]) {
		// Check if the user has permission for the command
		for (const permission of this.permissions) {
			const hasPermission = await permission.hasPermission(message.author);
			if (!hasPermission) {
				await message.reply(`❌ You do not have permission to use this command: **${this.name}**`);
				return;
			}
		}

		// Parse options from args (handle integer, string, and user)
		const options: Record<string, any> = {};
		const argsCopy = [...args];
		for (const [name, opt] of Object.entries(this.options)) {
			if (opt.required && argsCopy.length === 0) {
				await message.reply(`❌ Missing required argument: **${name}**`);
				return;
			}

			if (opt.type === "integer") {
				const value = parseInt(argsCopy.shift() ?? "NaN");
				if (isNaN(value)) {
					await message.reply(`❌ **${name}** must be a valid number.`);
					return;
				}
				options[name] = value;
			} else if (opt.type === "user") {
				const mention = argsCopy.shift();
				if (!mention || !mention.startsWith("<@") || !mention.endsWith(">")) {
					await message.reply(`❌ Please mention a valid user for **${name}**.`);
					return;
				}
				options[name] = message.mentions.users.first() as User;
			} else {
				options[name] = argsCopy.shift();
			}
		}

		// Execute the command with the options and arguments
		try {
			await this.prefixExecutor(message, argsCopy, options);
		} catch (error) {
			console.error(`Error executing prefix command '${this.name}':`, error);
			await message.reply("An error occurred while executing the command.");
		}
	}

	// Check if the provided command name or alias matches
	isAlias(commandName: string): boolean {
		return this.name === commandName || this.aliases.includes(commandName);
	}

	// Check if the command is available for the user
	async isAccessibleByUser(user: User): Promise<boolean> {
		// If no permissions are set, assume access is granted
		if (this.permissions.length === 0) return true;

		// Check all permissions, if the user has at least one valid permission, they can use the command
		for (const permission of this.permissions) {
			if (await permission.hasPermission(user)) {
				return true;
			}
		}

		// If the user doesn't have any required permissions, deny access
		return false;
	}
}
