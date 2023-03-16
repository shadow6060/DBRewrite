import { WorkerInfo } from "@prisma/client";
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

export async function getWorkerInfos(): Promise<WorkerInfo[]> {
	const workerInfos = await db.workerInfo.findMany();
	return workerInfos
		.filter(workerInfo => workerInfo.deliveries > 0 || workerInfo.preparations > 0)
		.sort((a, b) => (b.deliveries + b.preparations) - (a.deliveries + a.preparations));
}
