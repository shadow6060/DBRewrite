/* eslint-disable quotes */
/* eslint-disable indent */
import { PrismaClient } from "@prisma/client";
import { client } from "../providers/client";
const prisma = new PrismaClient();

// Map to hold cooldown Sets per guild
const cooldowns = new Map<string, Set<string>>();

client.on('messageCreate', async (message) => {
    // Ignore messages from bots or from DMs
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // If the user is in the cooldown Set for the guild, ignore this message
    if (cooldowns.get(guildId)?.has(userId)) return;

    // Create a Set for the guild if it doesn't exist
    if (!cooldowns.has(guildId)) {
        cooldowns.set(guildId, new Set<string>());
    }

    // Add the user to the cooldown Set for the guild
    cooldowns.get(guildId)?.add(userId);

    // Remove the user from the cooldown Set after 60 seconds
    setTimeout(() => {
        cooldowns.get(guildId)?.delete(userId);
    }, 60000); // 60000 milliseconds = 60 seconds

    try {
        // Check if the user exists in the userInfo table
        let userInfo = await prisma.userInfo.findUnique({
            where: {
                id: userId,
            },
        });

        if (!userInfo) {
            // If user does not exist, create a new userInfo record
            userInfo = await prisma.userInfo.create({
                data: {
                    id: userId,
                    balance: 0,
                    tabLimit: 0.0,
                    donuts: 0,
                } as any, // Explicitly specifying the type of 'data'
            });
        }

        // Create or retrieve the user's data from the database
        const guildsXPData = await prisma.guildsXP.upsert({
            where: {
                userId_guildId: {
                    userId: userId,
                    guildId: guildId,
                },
            },
            create: {
                userId: userId,
                guildId: guildId,
                level: 0,
                exp: 0,
            } as any, // Explicitly specifying the type of 'data'
            update: {},
        });

        // Increase their XP
        const xpGain = Math.floor(Math.random() * 20) + 1;
        guildsXPData.exp += xpGain;

        // Check if the user has enough XP to level up
        while (guildsXPData.exp >= guildsXPData.level * 100) {
            // If they do, increase their level and reset their XP
            guildsXPData.level += 1;
            guildsXPData.exp -= guildsXPData.level * 100;

            // Get the ID of the notification channel from the database
            const notificationChannelId = guildsXPData.notificationChannelId;
            if (notificationChannelId) {
                // Get the channel from the client
                const notificationChannel = client.channels.cache.get(notificationChannelId);

                // Check if the channel exists and is a text channel
                if (notificationChannel && notificationChannel.isTextBased()) {
                    // Send a notification to the channel
                    notificationChannel.send(`${message.author.username} has leveled up to level ${guildsXPData.level}!`);
                }
            }
        }

        // Ensure exp is not negative
        if (guildsXPData.exp < 0) {
            guildsXPData.exp = 0;
        }

        // Update the user's data in the database
        await prisma.guildsXP.update({
            where: {
                userId_guildId: {
                    userId: userId,
                    guildId: guildId,
                },
            },
            data: {
                level: guildsXPData.level,
                exp: guildsXPData.exp,
            },
        });
    } catch (error) {
        console.error('Error handling user data:', error);
        return;
    }
});


// Close the Prisma connection when the script is exiting
process.on('beforeExit', () => {
    prisma.$disconnect();
});
