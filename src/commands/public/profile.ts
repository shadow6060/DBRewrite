import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const command = new Command("profile", "Shows your profile.")
    .setExecutor(async (int: CommandInteraction) => {
        // Check if the interaction is from a guild
        if (!int.guild) {
            await int.reply("This command can only be used in a server.");
            return;
        }

        try {
            const userData = await prisma.userInfo.findUnique({
                where: {
                    id: int.user.id,
                },
            });

            if (!userData) {
                await int.reply("You don't have a profile yet.");
                return;
            }

            let guildsxp: Record<string, { xp: number; level: number }> = {};
            if (typeof userData.guildsxp === 'string') {
                guildsxp = JSON.parse(userData.guildsxp);
            }

            const userGuildData = guildsxp[int.guild.id] || { xp: 0, level: 1 };
            const nextLevelExp = userGuildData.level * 100;
            const level = userGuildData.level;

            // Create a new embed using EmbedBuilder
            const embed = new EmbedBuilder()
                .setTitle(`${int.user.username}'s Profile`)
                .setThumbnail(int.user.displayAvatarURL())
                .addFields(
                    { name: "Experience", value: `${userGuildData.xp}/${nextLevelExp}`, inline: true },
                    { name: "Level", value: `${level}`, inline: true }
                )
                .setColor("#0099ff");

            await int.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error retrieving user data:', error);
            return;
        }
    });