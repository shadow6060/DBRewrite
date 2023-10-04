/* eslint-disable quotes */
import { WorkerInfo } from "@prisma/client";
import type { UserResolvable } from "discord.js";
import { resolveUserId } from "../utils/id";
import { db } from "./database";

export const getWorkerInfo = async (user: UserResolvable) => db.workerInfo.findFirst({ where: { id: resolveUserId(user) } });

export const upsertWorkerInfo = async (user: UserResolvable, lastCommandName?: string) => {
	const userId = resolveUserId(user);

	// Check if the worker info exists
	const existingWorkerInfo = await db.workerInfo.findUnique({
		where: { id: userId },
	});

	if (existingWorkerInfo) {
		// Update existing worker info
		return db.workerInfo.update({
			where: { id: userId },
			data: {
				lastCommandUsage: lastCommandName ? new Date() : existingWorkerInfo.lastCommandUsage,
				lastCommandName: lastCommandName || existingWorkerInfo.lastCommandName,
				commandUsageCount: lastCommandName ? existingWorkerInfo.commandUsageCount + 1 : existingWorkerInfo.commandUsageCount,
				claimUsageCount: lastCommandName && lastCommandName.toLowerCase() === 'claim' ? existingWorkerInfo.claimUsageCount + 1 : existingWorkerInfo.claimUsageCount,
				brewUsageCount: lastCommandName && lastCommandName.toLowerCase() === 'brew' ? existingWorkerInfo.brewUsageCount + 1 : existingWorkerInfo.brewUsageCount,
			},
		});
	} else {
		// Create new worker info with default values
		return db.workerInfo.create({
			data: {
				id: userId,
				lastCommandUsage: lastCommandName ? new Date() : null,
				lastCommandName: lastCommandName || null,
				commandUsageCount: lastCommandName ? 1 : 0,
				claimUsageCount: lastCommandName && lastCommandName.toLowerCase() === 'claim' ? 1 : 0,
				brewUsageCount: lastCommandName && lastCommandName.toLowerCase() === 'brew' ? 1 : 0,
			},
		});
	}
};

export async function getWorkerInfos(): Promise<WorkerInfo[]> {
	const workerInfos = await db.workerInfo.findMany();
	return workerInfos
		.filter(workerInfo => workerInfo.deliveries > 0 || workerInfo.preparations > 0)
		.sort((a, b) => (b.deliveries + b.preparations) - (a.deliveries + a.preparations));
}
