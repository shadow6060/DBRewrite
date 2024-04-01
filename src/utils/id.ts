import type { UserResolvable } from "discord.js";
import { ThreadMember } from "discord.js";
import { GuildMember, Message, User } from "discord.js";

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
						: (() => { throw new Error(`Invalid argument ${user} provided.`); })();
