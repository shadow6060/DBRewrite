/* eslint-disable quotes */
import { PrismaClient, UserInfo } from '@prisma/client';
import type { User, UserResolvable } from 'discord.js';
import { resolveUserId } from '../utils/id';

const prisma = new PrismaClient();

export const getUserInfo = async (user: UserResolvable) =>
	prisma.userInfo.findFirst({ where: { id: resolveUserId(user) } });

export const upsertUserInfo = async (user: User, guildId: string): Promise<UserInfo> => {
	const existingUserInfo = await prisma.userInfo.findUnique({
		where: {
			id: resolveUserId(user),
		},
	});

	if (existingUserInfo) {
		return existingUserInfo;
	}

	const createdUserInfo = await prisma.userInfo.create({
		data: {
			id: resolveUserId(user),
		},
	});

	return createdUserInfo;
};


export const getUserBalance = async (user: UserResolvable): Promise<{ balance: number; donuts: number }> => {
	const userInfo = await prisma.userInfo.findUnique({
		where: {
			id: resolveUserId(user),
		},
		select: {
			balance: true,
			donuts: true,
		},
	});

	const balance = userInfo?.balance ?? 0;
	const donuts = userInfo?.donuts ?? 0;

	return { balance, donuts };
};

export const updateBalance = async (
	user: UserResolvable,
	newBalance: number,
	newDonuts: number
): Promise<UserInfo | null> => {
	const balance = Math.floor(newBalance);
	const donuts = Math.floor(newDonuts);

	const updatedUserInfo = await prisma.userInfo.update({
		where: {
			id: resolveUserId(user),
		},
		data: {
			balance: balance,
			donuts: donuts,
		},
	});

	return updatedUserInfo;
};
