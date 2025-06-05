/* eslint-disable no-mixed-spaces-and-tabs */
import { PrismaClient } from "@prisma/client";
import { client } from "../../providers/client";
import { TextChannel } from "discord.js";

const prisma = new PrismaClient();
const cooldowns = new Map<string, Set<string>>();

client.on("messageCreate", async (message) => {
	if (message.author.bot || !message.guild) return;

	const guildId = message.guild.id;
	const userId = message.author.id;
	const channelId = message.channel.id;

	// Check cooldown
	if (!cooldowns.has(guildId)) cooldowns.set(guildId, new Set<string>());
	if (cooldowns.get(guildId)?.has(userId)) return;

	cooldowns.get(guildId)?.add(userId);
	setTimeout(() => cooldowns.get(guildId)?.delete(userId), 60000);

	try {
		const serverConfig = await prisma.serverConfig.findUnique({ where: { guildId } });

		const isChannelXPEnabled = serverConfig?.xpEnabledChannels.includes(channelId);
		const xpAllowed =
            serverConfig?.xpEnabled &&
            (
            	!serverConfig?.xpEnabledChannels.length ||
                isChannelXPEnabled
            );

		if (!xpAllowed) return;

		// ✅ Log server config only if XP is allowed
		/*console.log("🔧 Server Config:", {
			xpEnabled: serverConfig?.xpEnabled,
			xpEnabledChannels: serverConfig?.xpEnabledChannels,
		});
*/
		let userInfo = await prisma.userInfo.findUnique({ where: { id: userId } });
		if (!userInfo) {
			userInfo = await prisma.userInfo.create({
				data: {
					id: userId,
					balance: 0,
					tabLimit: 0.0,
					donuts: 0,
				} as any,
			});
		}

		const guildsXPData = await prisma.guildsXP.upsert({
			where: { userId_guildId: { userId, guildId } },
			create: { userId, guildId, level: 0, exp: 0 } as any,
			update: {},
		});

		const xpGain = Math.floor(Math.random() * 20) + 1;
		guildsXPData.exp += xpGain;

		while (guildsXPData.exp >= guildsXPData.level * 100 && guildsXPData.level < 999) {
			guildsXPData.level += 1;
			guildsXPData.exp -= guildsXPData.level * 100;

			const notificationChannelId = serverConfig?.notificationChannel;
			if (notificationChannelId) {
				const notificationChannel = client.channels.cache.get(notificationChannelId);
				if (notificationChannel instanceof TextChannel) {
					notificationChannel.send(`🎉 **${message.author.username}** has leveled up to level **${guildsXPData.level}**!`);
				}
			}
		}

		if (guildsXPData.exp < 0) {
			guildsXPData.exp = 0;
		}

		await prisma.guildsXP.update({
			where: { userId_guildId: { userId, guildId } },
			data: {
				level: guildsXPData.level,
				exp: guildsXPData.exp,
			},
		});

	} catch (error) {
		//console.error("❌ Error handling XP:", error);
	}
});

process.on("beforeExit", () => {
	prisma.$disconnect();
});
