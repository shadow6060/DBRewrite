import { PrismaClient } from "@prisma/client";
import { config } from "../providers/config"; // Import config to access the tab settings

const prisma = new PrismaClient();

// Parse config values
const partialPaymentTimeout = Number(config.tabConfig.partialPaymentTimeout); // 24 hours in ms
const paymentWarningTimeout = Number(config.tabConfig.paymentWarningTimeout); // 1 hour in ms
const maxTabLimit = Number(config.tabConfig.maxLimit); // Max tab limit

export async function getOrCreateTab(userId: string, guildId: string) {
	let tab = await prisma.tab.findUnique({
		where: { userId_guildId: { userId, guildId } },
	});

	if (!tab) {
		tab = await prisma.tab.create({
			data: {
				userId, 
				guildId,
				amount: 0,
				maxLimit: maxTabLimit, // Use maxTabLimit from config
				isBlocked: false,
				lastPaidAt: null,
			},
		});
	}

	return tab;
}

export async function addToTab(userId: string, guildId: string, amount: number) {
	const tab = await getOrCreateTab(userId, guildId);
	const newAmount = tab.amount + amount;
	const shouldBlock = newAmount >= tab.maxLimit;

	return prisma.tab.update({
		where: { userId_guildId: { userId, guildId } },
		data: {
			amount: newAmount,
			isBlocked: shouldBlock,
		},
	});
}

export async function clearTab(userId: string, guildId: string) {
	return prisma.tab.update({
		where: { userId_guildId: { userId, guildId } },
		data: {
			amount: 0,
			isBlocked: false,
			lastPaidAt: new Date(),
		},
	});
}

export async function updateTabLimit(userId: string, guildId: string, newLimit: number) {
	return prisma.tab.update({
		where: { userId_guildId: { userId, guildId } },
		data: {
			maxLimit: newLimit,
			isBlocked: false,
		},
	});
}

export async function isTabBlocked(userId: string, guildId: string) {
	const tab = await prisma.tab.findUnique({
		where: { userId_guildId: { userId, guildId } },
		select: { isBlocked: true },
	});

	return tab?.isBlocked ?? false;
}

// ✅ NEW: Returns full status (amount, limit, block, lastPaidAt)
export async function getTabStatus(userId: string, guildId: string) {
	return await prisma.tab.findUnique({
		where: { userId_guildId: { userId, guildId } },
		select: {
			amount: true,
			maxLimit: true,
			isBlocked: true,
			lastPaidAt: true,
		},
	});
}

// ✅ NEW: Returns true if the tab has ever been paid
export async function hasPaidTab(userId: string, guildId: string) {
	const tab = await prisma.tab.findUnique({
		where: { userId_guildId: { userId, guildId } },
		select: { lastPaidAt: true },
	});
	return !!tab?.lastPaidAt;
}

// ✅ NEW: Recalculates and updates block status manually
export async function reevaluateTabBlock(userId: string, guildId: string) {
	const tab = await getOrCreateTab(userId, guildId);
	const shouldBlock = tab.amount >= tab.maxLimit;

	await prisma.tab.update({
		where: { userId_guildId: { userId, guildId } },
		data: { isBlocked: shouldBlock },
	});

	return shouldBlock;
}