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
            const userId = int.user.id;
            const guildId = int.guild.id;

            // Check if the user exists in the userInfo table
            const userInfo = await prisma.userInfo.findUnique({
                where: {
                    id: userId,
                },
            });

            if (!userInfo) {
                await int.reply("You don't have a profile yet.");
                return;
            }

            // Check if the user's guildsXP data exists in the database
            let userGuildData = await prisma.guildsXP.findUnique({
                where: {
                    userId_guildId: {
                        userId: userId,
                        guildId: guildId,
                    },
                },
            });

            if (!userGuildData) {
                // If the data doesn't exist, create it in the database
                userGuildData = await prisma.guildsXP.create({
                    data: {
                        userId: userId,
                        guildId: guildId,
                        userName: int.user.username,
                        level: 0,
                        exp: 0,
                        user: { connect: { id: userId } }, // Connect the guildsXP to the UserInfo
                    },
                });
            } else if (!userGuildData.userName) {
                // If the userName is blank, update it with the user's username
                userGuildData = await prisma.guildsXP.update({
                    where: {
                        userId_guildId: {
                            userId: userId,
                            guildId: guildId,
                        },
                    },
                    data: {
                        userName: int.user.username,
                    },
                });
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
