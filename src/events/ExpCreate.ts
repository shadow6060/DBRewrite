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
        let userData = await prisma.userInfo.findUnique({
            where: {
                id: userId,
            },
        });
        if (!userData) {
            // If the user doesn't exist in the database, create a new entry
            userData = await prisma.userInfo.create({
                data: {
                    id: userId,
                    guildsxp: JSON.stringify({}),
                },
            });
        }

        let guildsxp: Record<string, { xp: number; level: number }> = {};
        if (typeof userData.guildsxp === 'string') {
            guildsxp = JSON.parse(userData.guildsxp);
        }

        if (!guildsxp[guildId]) {
            // If they don't, initialize it
            guildsxp[guildId] = { xp: Math.floor(Math.random() * 20) + 1, level: 1 };
        } else {
            // Increase their XP
            guildsxp[guildId].xp += Math.floor(Math.random() * 20) + 1;
            // Check if the user has enough XP to level up
            if (guildsxp[guildId].xp >= guildsxp[guildId].level * 100) {
                // If they do, increase their level and reset their XP
                guildsxp[guildId].level += 1;
                guildsxp[guildId].xp = 0;
                // Send a message to the user to notify them of the level up
                message.reply(`Congratulations! You have leveled up to level ${guildsxp[guildId].level}!`);
            }
        }

        // Update the user's data in the database
        await prisma.userInfo.update({
            where: {
                id: userId,
            },
            data: { guildsxp: JSON.stringify(guildsxp) },
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