/* eslint-disable indent */
/* eslint-disable quotes */
import { PrismaClient, UserInfo } from '@prisma/client';
import { MessageFlags, type CommandInteraction, type User, type UserResolvable } from 'discord.js';
import { resolveUserId } from '../utils/id';
import { text } from '../providers/config';

const prisma = new PrismaClient();

export const getUserInfo = async (user: UserResolvable) =>
	prisma.userInfo.findFirst({ where: { id: resolveUserId(user) } });

export const upsertUserInfo = async (user: User): Promise<UserInfo> => {
	let userInfo = await prisma.userInfo.findUnique({
		where: { id: resolveUserId(user) },
	});

	if (!userInfo) {
		userInfo = await prisma.userInfo.create({
			data: {
				id: resolveUserId(user),
				profileCreated: true,
				profileCreationDate: new Date()
			}
		});
	}

	return userInfo;
};

export const getUserBalance = async (user: UserResolvable): Promise<{ balance: number; donuts?: number }> => {
	const userInfo = await prisma.userInfo.findUnique({
		where: {
			id: resolveUserId(user),
		},
		select: {
			balance: true,
			donuts: true,
		},
	});

	const balance = userInfo ? Number(userInfo.balance) : 0;
	const donuts = userInfo ? Number(userInfo.donuts) : undefined;

	return { balance, donuts };
};

export const updateBalance = async (
	user: UserResolvable,
	newBalance: number,
	newDonuts?: number
): Promise<UserInfo | null> => {
	if (isNaN(newBalance) || typeof newBalance !== 'number') {
		console.error('Invalid newBalance:', newBalance);
		return null;
	}

	const balance = Math.floor(newBalance);
	const donuts = newDonuts !== undefined ? Math.floor(newDonuts) : undefined;

	return await prisma.userInfo.update({
		where: { id: resolveUserId(user) },
		data: {
			balance,
			...(donuts !== undefined && { donuts }),
		},
	});
};

export const createGuildData = async (
	userId: string,
	guildId: string,
	level: number,
	exp: number,
	notificationChannelId?: string
): Promise<void> => {
	await prisma.guildsXP.create({
		data: {
			userId,
			guildId,
			level,
			exp,
			notificationChannelId,
		} as any,
	});
};

export const requireUserProfile = async (
	userId: string,
	int: CommandInteraction
) => {
	const info = await getUserInfo(userId);

	if (!info || !info.profileCreated) {
		await int.reply({
			content: text.common.noProfile,
			flags: MessageFlags.Ephemeral,
		});
		return null;
	}

	return info;
};

export const formatDate = (date: Date) => {
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
		hour12: true, // 12-hour format (AM/PM)
	});
};
