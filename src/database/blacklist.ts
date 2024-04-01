import type { UserResolvable } from "discord.js";
import { IllegalStateError } from "../utils/error";
import { resolveUserId } from "../utils/id";
import { db } from "./database";

export const blacklist = new Set<string>();

export const createBlacklist = async (user: UserResolvable, blacklister: UserResolvable, reason: string) => {
	blacklist.add(resolveUserId(user));
	await db.blacklist.create({ data: { id: resolveUserId(user), blacklister: resolveUserId(blacklister), reason } });
};

db.blacklist.findMany().then(b => b.map(v => blacklist.add(v.id))).catch(x => { throw new IllegalStateError(`Failed to fetch blacklists: ${x}`); });