//profile.ts
/* eslint-disable quotes */
/* eslint-disable indent */
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
            const userGuildData = await prisma.guildsXP.findUnique({
                where: {
                    userId_guildId: {
                        userId: int.user.id,
                        guildId: int.guild.id,
                    },
                },
            });

            if (!userGuildData) {
                await int.reply("You don't have a profile yet.");
                return;
            }

            const nextLevelExp = userGuildData.level * 100;
            const level = userGuildData.level;

            // Create a new embed using EmbedBuilder
            const embed = new EmbedBuilder()
                .setTitle(`${int.user.username}'s Profile`)
                .setThumbnail(int.user.displayAvatarURL())
                .addFields(
                    { name: "Experience", value: `${userGuildData.exp}/${nextLevelExp}`, inline: true },
                    { name: "Level", value: `${level}`, inline: true }
                )
                .setColor("#0099ff");

            await int.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error retrieving user data:', error);
            return;
        }
    });