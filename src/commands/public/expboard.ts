//expboard
/* eslint-disable quotes */
/* eslint-disable indent */
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const command = new Command("expboard", "Shows the leaderboard.")
    .setExecutor(async (int: CommandInteraction) => {
        // Check if the interaction is from a guild
        if (!int.guild) {
            await int.reply("This command can only be used in a server.");
            return;
        }

        // Get all users in the guild
        const users = await prisma.guildsXP.findMany({
            where: {
                guildId: int.guild.id,
            },
        });

        // Sort the users by level and exp
        users.sort((a, b) => b.level - a.level || b.exp - a.exp);

        // Take the top 10 users
        const leaderboard = users.slice(0, 10);

        // Format the leaderboard into a string
        let leaderboardString = leaderboard.map((user, index) => {
            return `${index + 1}. <@${user.userId}> - Level ${user.level}`;
        }).join('\n');

        // Check if the leaderboard is empty
        if (leaderboardString === '') {
            leaderboardString = 'No users in the leaderboard yet.';
        }

        // Create a new embed
        const embed = new EmbedBuilder()
            .setTitle("Leaderboard")
            .setDescription(leaderboardString)
            .setColor("#0099ff");

        await int.reply({ embeds: [embed] });
    });