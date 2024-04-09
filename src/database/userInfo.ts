/* eslint-disable quotes */
import { PrismaClient, UserInfo } from '@prisma/client';
import type { User, UserResolvable } from 'discord.js';
import { resolveUserId } from '../utils/id';

const prisma = new PrismaClient();

export const getUserInfo = async (user: UserResolvable) =>
	prisma.userInfo.findFirst({ where: { id: resolveUserId(user) } });

export const upsertUserInfo = async (user: User, guildId: string): Promise<UserInfo> => {
	let userInfo = await prisma.userInfo.findUnique({
		where: {
			id: resolveUserId(user),
		},
	});

	if (!userInfo) {
		userInfo = await prisma.userInfo.create({
			data: {
				id: resolveUserId(user),
				userName: user.username,
				guildId: guildId,
			} as any, // Explicitly specifying the type of 'data'
		});
	}

	return userInfo;
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

	// Parse balance and donuts as numbers
	const balance = userInfo ? Number(userInfo.balance) : 0;
	const donuts = userInfo ? Number(userInfo.donuts) : 0;

	return { balance, donuts };
};


// Update user balance function
export const updateBalance = async (
	user: UserResolvable,
	newBalance: number,
	newDonuts?: number // Making newDonuts optional
): Promise<UserInfo | null> => {
	// Check if newBalance is a valid number
	if (isNaN(newBalance) || typeof newBalance !== 'number') {
		console.error('Invalid newBalance:', newBalance);
		return null;
	}

	// Ensure balance is a whole number
	const balance = Math.floor(newBalance);

	// Update the user's balance in the database
	const updatedUserInfo = await prisma.userInfo.update({
		where: {
			id: resolveUserId(user),
		},
		data: {
			balance: balance,
			// Update donuts only if newDonuts is provided
			...(newDonuts !== undefined && { donuts: Math.floor(newDonuts) }),
		},
	});

	return updatedUserInfo;
};
