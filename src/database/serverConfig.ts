import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getserverConfig = async (guildId: string) =>
	prisma.serverConfig.findUnique({ where: { guildId } });

export const upsertserverConfig = async (
	guildId: string,
	data: Partial<{
        notificationChannel: string;
        welcomeChannel: string;
        prefix: string;
        xpEnabled: boolean;
        xpEnabledChannels: string[];
        adminRoles?: string[];
		moderatorRoles?: string[];

    }>
) =>
	prisma.serverConfig.upsert({
		where: { guildId },
		create: { guildId, ...data },
		update: { ...data },
	});
