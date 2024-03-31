import type {UserResolvable} from "discord.js";
import {IllegalStateError} from "../utils/error";
import {resolveUserId} from "../utils/id";
import {db} from "./database";

/**
 * A set of blacklisted user IDs.
 */
export const blacklist = new Set<string>();

/**
 * Adds a user to the blacklist.
 * @param user - The user to add to the blacklist.
 * @param blacklister - The user who blacklisted the user.
 * @param reason - The reason for blacklisting the user.
 */
export const createBlacklist = async (user: UserResolvable, blacklister: UserResolvable, reason: string) => {
	blacklist.add(resolveUserId(user));
	await db.blacklist.create({data: {id: resolveUserId(user), blacklister: resolveUserId(blacklister), reason}});
};

db.blacklist.findMany().then(b => b.map(v => blacklist.add(v.id))).catch(x => {
	throw new IllegalStateError(`Failed to fetch blacklists: ${x}`);
});