import type { UserResolvable } from "discord.js";
import { resolveUserId } from "../utils/id";
import { db } from "./database";

export const getWorkerInfo = async (user: UserResolvable) => db.workerInfo.findFirst({ where: { id: resolveUserId(user) } });
export const upsertWorkerInfo = async (user: UserResolvable) =>
	db.workerInfo.upsert({
		where: { id: resolveUserId(user) },
		create: {
			id: resolveUserId(user)
		},
		update: {}
	});
