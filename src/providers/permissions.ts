import type { CommandInteraction, UserResolvable } from "discord.js";
import { DiscordAPIError } from "discord.js";
import { z } from "zod";
import { StopCommandExecution } from "../utils/error";
import { resolveUserId } from "../utils/id";
import { format, parseText } from "../utils/string";
import { typedFromEntries, typedKeys } from "../utils/utils";
import { config, parseHjson, snowflake, text } from "./config";
import { mainGuild } from "./discord";

const permissionSchema = z.object({
	grant: z.union([z.string(), z.string().array()]).optional(),
	roles: z
		.record(z.union([snowflake, z.never(), ...Object.keys(config.roles).map(x => z.literal(x))]), z.boolean())
		.optional(),
	users: z.record(z.union([snowflake, z.literal("<developers>")]), z.boolean()).optional(),
});
const permissionsSchema = z
	.object({
		developer: permissionSchema,
		employee: permissionSchema,
		moderator: permissionSchema,
		admin: permissionSchema,
	})
	.strict();

const parsed = parseHjson(permissionsSchema, "permissions.hjson");

/**
 * Represents a permission. Permissions can be granted to users, roles, or other permissions.
 */
export class Permission {
	/** The permissions that this permission is a child of. */
	readonly parents: readonly Permission[] = [];
	/** The permissions that this permission is a parent of. */
	readonly children: readonly Permission[] = [];
	/** The roles that have this permission. */
	readonly roles: Record<string, boolean> = {};
	/** The users that have this permission. */
	readonly users: Record<string, boolean> = {};
	constructor(public name: string) { }
	/** Adds a parent permission, and adds this permission as a child of the parent. */
	addParent(permission: Permission) {
		(this.parents as Permission[]).push(permission);
		if (!permission.children.includes(this)) permission.addChild(this);
	}

	/** Adds a child permission, and adds this permission as a parent of the child. */
	addChild(permission: Permission) {
		(this.children as Permission[]).push(permission);
		if (!permission.parents.includes(this)) permission.addParent(this);
	}

	/** Returns whether the user has this permission. */
	async hasPermission(ur: UserResolvable) {
		const user = resolveUserId(ur);
		if (user in this.users) return this.users[user];
		try {
			const member = await mainGuild.members.fetch(ur).catch(() => null);
			if (member)
				for (const role of member.roles.cache.keys()) {
					if (role in this.roles) return this.roles[role];
				}
		} catch (e) {
			if (!(e instanceof DiscordAPIError)) throw e;
		}
		for (const child of this.children) if (await child.hasPermission(ur)) return true;
		return false;
	}

	/** Throws an error if the user does not have this permission. */
	async check(int: CommandInteraction) {
		if (!(await this.hasPermission(int.user))) {
			await int.reply({
				ephemeral: true,
				content: format(text.errors.unauthorized, this.name),
			});
			throw new StopCommandExecution();
		}
	}
}


/** All permissions from the `permissions.hjson` file. */
export const permissionsArray = typedKeys(parsed).map(k => new Permission(k));
/** All permissions from the `permissions.hjson` file, as an object with the permission names as keys. */
export const permissions = typedFromEntries(permissionsArray.map(x => [x.name, x])) as Record<keyof typeof parsed, Permission>;

// Parse the permissions file and apply the parsed data to the permissions.
for (const [i, v] of Object.values(parsed).entries()) {
	const perm = permissionsArray[i];
	if ("grant" in v) {
		const toGrant = typeof v.grant === "string" ? [v.grant] : v.grant ?? [];
		for (const g of toGrant) perm.addParent(permissionsArray.find(x => x.name === g)!);
	}
	if ("users" in v) Object.assign(perm.users, v.users ?? {});
	if ("roles" in v) Object.assign(perm.roles, v.roles ?? {});
	for (const u in perm.users)
		if (u === "<developers>") {
			for (const dev of config.developers) perm.users[dev] = perm.users[u];
			delete perm.users[u];
		}
	for (const r in perm.roles) {
		const role = config.roles[r as keyof typeof config["roles"]];
		if (role !== undefined) {
			perm.roles[role] = perm.roles[r];
			delete perm.roles[r];
		}
	}
}
