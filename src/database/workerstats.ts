/* eslint-disable quotes */
/* eslint-disable indent */
import { OrderStatus, WorkerStats } from "@prisma/client";
import type { UserResolvable } from "discord.js";
import { resolveUserId } from "../utils/id";
import { db } from "./database";
import { getClaimedOrder } from "./orders";

export const getWorkerStats = async (user: UserResolvable) => db.workerStats.findFirst({ where: { id: resolveUserId(user) } });

export const upsertWorkerStats = async (user: UserResolvable, stats: Partial<WorkerStats>) => {
    const existingStats = await getWorkerStats(user);

    if (existingStats) {
        // If the stats exist, update them
        await db.workerStats.update({
            where: { id: resolveUserId(user) },
            data: {
                ordersBrewed: (existingStats.ordersBrewed ?? 0) + (stats.ordersBrewed ?? 0),
                ordersDelivered: (existingStats.ordersDelivered ?? 0) + (stats.ordersDelivered ?? 0),
                lastUsed: new Date(),
                lastCommand: stats.lastCommand ?? existingStats.lastCommand, // Update lastCommand
            },
        });
    } else {
        // If the stats don't exist, create them
        await db.workerStats.create({
            data: {
                id: resolveUserId(user),
                ordersBrewed: stats.ordersBrewed ?? 0,
                ordersDelivered: stats.ordersDelivered ?? 0,
                lastUsed: new Date(),
                lastCommand: stats.lastCommand ?? null, // Set lastCommand
            },
        });
    }
};

export const handleBrew = async (user: UserResolvable) => {
    const order = await getClaimedOrder(user);

    // Check if the user has a claimed order and if the order is in the correct status
    if (order && order.status === OrderStatus.Brewing) {
        await upsertWorkerStats(user, {
            ordersBrewed: 1,
            lastCommand: "brew", // Set lastCommand to "brew" when brewing
        });
    }
};

export const handleDeliver = async (user: UserResolvable) => {
    await upsertWorkerStats(user, {
        ordersDelivered: 1,
        lastCommand: "deliver", // Set lastCommand to "deliver" when delivering
    });
};

export async function getWorkerStatsList(): Promise<WorkerStats[]> {
    const workerStatsList = await db.workerStats.findMany();
    return workerStatsList;
}
