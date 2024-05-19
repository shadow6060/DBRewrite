import type {UserResolvable} from "discord.js";
import {GuildMember, Message, ThreadMember, User} from "discord.js";

/**
 * Resolves the user ID from a UserResolvable object.
 *
 * @param user - The UserResolvable object.
 * @returns The resolved user ID.
 * @throws Error if an invalid argument is provided.
 */
export const resolveUserId = (user: UserResolvable) =>
	typeof user === "string"
		? user
		: user instanceof User
			? user.id
			: user instanceof Message
				? user.author.id
				: user instanceof GuildMember
					? user.id
					: user instanceof ThreadMember
						? user.id
						: (() => {
							throw new Error(`Invalid argument ${user} provided.`);
						})();
