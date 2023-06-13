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
        const users = await prisma.userInfo.findMany();

        // Parse the guildsxp field and add the level and exp for the current guild to the user objects
        const usersWithLevels = users.map(user => {
            const guildsxp = typeof user.guildsxp === 'string' ? JSON.parse(user.guildsxp) : {};
            return {
                ...user,
                level: guildsxp[int.guild.id]?.level ?? 0,
                exp: guildsxp[int.guild.id]?.exp ?? 0
            };
        });

        // Sort the users by level and exp
        usersWithLevels.sort((a, b) => b.level - a.level || b.exp - a.exp);

        // Take the top 10 users
        const leaderboard = usersWithLevels.slice(0, 10);

        // Format the leaderboard into a string
        let leaderboardString = leaderboard.map((user, index) => {
            return `${index + 1}. <@${user.id}> - Level ${user.level}`;
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
