/* eslint-disable quotes */
/* eslint-disable indent */
import {PrismaClient} from "@prisma/client";
import {Command} from "../../structures/Command";

const prisma = new PrismaClient();

export const command = new Command("notifi",
	"Sets the channel for notifications.")
	//.addPermission(permissions.employee)
	.addOption("channel", (o) =>
		o.setName("channel").setDescription("The channel to set for notifications.").setRequired(true)
	)
	.setExecutor(async (int) => {
		// Ignore interactions from bots or from DMs
		if (int.user.bot || !int.guild) return;

		// Get the ID of the channel from the command option
		const channelId = int.options.getChannel("channel")?.id;
		if (!channelId) {
			await int.reply("Please provide a valid channel.");
			return;
		}

		// Update the notification channel in the database
		await prisma.guildsXP.upsert({
			where: {
				userId_guildId: {
					userId: int.user.id,
					guildId: int.guild.id,
				},
			},
			create: {
				userId: int.user.id,
				guildId: int.guild.id,
				userName: int.user.username,
				level: 0,
				exp: 0,
				location: "default",
				notificationChannelId: channelId, // Set the notification channel ID
			},
			update: {
				notificationChannelId: channelId, // Update the notification channel ID
			},
		});

		await int.reply(`Notification channel set to <#${channelId}>.`);
	});
