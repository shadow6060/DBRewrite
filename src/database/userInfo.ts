import type { UserResolvable } from "discord.js";
import { resolveUserId } from "../utils/id";
import { db } from "./database";

export const getUserInfo = async (user: UserResolvable) => db.userInfo.findFirst({ where: { id: resolveUserId(user) } });
export const upsertUserInfo = async (user: UserResolvable) =>
	db.userInfo.upsert({
		where: { id: resolveUserId(user) },
		create: {
			id: resolveUserId(user)
		},
		update: {}
	});
