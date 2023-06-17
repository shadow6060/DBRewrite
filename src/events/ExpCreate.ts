//ExpCreate.ts
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
                userName: message.author.username,
                level: 0,
                exp: 0,
            },
            update: {},
        });

        // Increase their XP
        guildsXPData.exp += Math.floor(Math.random() * 20) + 1;

        // Check if the user has enough XP to level up
        if (guildsXPData.exp >= guildsXPData.level * 100) {
            // If they do, increase their level and reset their XP
            guildsXPData.level += 1;
            guildsXPData.exp = 0;
            // Send a message to the user to notify them of the level up
            message.reply(`Congratulations! You have leveled up to level ${guildsXPData.level}!`);
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