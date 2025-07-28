import type { CommandInteraction } from "discord.js";
import { MessageFlags } from "discord.js";

import { Command } from "../../structures/Command";
import { ExtendedCommand } from "../../structures/extendedCommand";
import { config, text } from "../../providers/config";
import { permissions, Permission } from "../../providers/permissions";

type ExecutorFn = (int: CommandInteraction) => Promise<void> | void;

interface LocalCommandOptions {
	name: string;
	description: string;
	executor?: ExecutorFn;
	permission?: Permission | Permission[];
	category?: string;
}

interface PublicCommandOptions {
	name: string;
	description: string;
	executor?: ExecutorFn;
	permission?: Permission | Permission[];
	category?: string;
}

/**
 * Internal utility to wrap executor with a permission check.
 */
async function runWithPermissionCheck(
	int: CommandInteraction,
	perms: Permission[],
	executor: ExecutorFn
) {
	for (const perm of perms) {
		const has = await perm.hasPermission(int.user);
		if (!has) {
			await int.reply({
				content: text.errors.unauthorized.replace("{}", perm.name),
				ephemeral: true,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
	}

	await executor(int);
}

/**
 * Helper to create a public/global command.
 * Permissions and executor can be set later via chaining,
 * or provided in options with auto wrapping.
 */
export function createPublicCommand(opts: PublicCommandOptions | { name: string; description: string }) {
	const command = new Command(opts.name, opts.description);

	// If permissions provided, add them
	if ("permission" in opts && opts.permission) {
		const perms = Array.isArray(opts.permission) ? opts.permission : [opts.permission];
		perms.forEach((perm) => command.addPermission(perm));
	}

	if ("category" in opts && opts.category) {
		command.setCategory(opts.category);
	}

	// Wrap executor if provided
	if ("executor" in opts && opts.executor) {
		const perms = "permission" in opts && opts.permission
			? Array.isArray(opts.permission) ? opts.permission : [opts.permission]
			: [permissions.employee];

		command.setExecutor((int) => runWithPermissionCheck(int, perms, opts.executor!));
	}

	return command;
}

/**
 * Helper to create a local/dev-only command.
 * Permissions and executor can be set later via chaining,
 * or provided in options with auto wrapping.
 */
export function createLocalCommand(opts: LocalCommandOptions | { name: string; description: string }) {
	const command = new ExtendedCommand({
		name: opts.name,
		description: opts.description,
		local: true,
		servers: [config.servers.local],
	});

	// If permissions provided, add them
	if ("permission" in opts && opts.permission) {
		const perms = Array.isArray(opts.permission) ? opts.permission : [opts.permission];
		perms.forEach((perm) => command.addPermission(perm));
	}

	if ("category" in opts && opts.category) {
		command.setCategory(opts.category);
	}

	// Wrap executor if provided
	if ("executor" in opts && opts.executor) {
		const perms = "permission" in opts && opts.permission
			? Array.isArray(opts.permission) ? opts.permission : [opts.permission]
			: [permissions.developer];

		command.setExecutor((int) => runWithPermissionCheck(int, perms, opts.executor!));
	}

	return command;
}
