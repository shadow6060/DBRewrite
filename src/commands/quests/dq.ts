/* eslint-disable indent */
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database";

export const command = new Command("dq", "View your daily quests.")
    .setExecutor(async (interaction: CommandInteraction) => {
        try {
            const userId = interaction.user.id;
            const questId = 1; // ID of the quest for which exp is granted
            const expAmount = 50; // Custom amount of exp to grant

            console.log(`User ID: ${userId}`);

            // Fetch quests from the database, ordered by their ID to maintain their position
            const quests = await db.quest.findMany({
                orderBy: { id: "asc" }  // Order by ID in ascending order
            });

            console.log("Quests fetched:", quests);

            // Retrieve user-specific quest progress from the database
            let userQuestProgressRecords = await db.userQuestProgress.findMany({
                where: {
                    userId
                }
            });

            console.log("User quest progress records fetched:", userQuestProgressRecords);

            // If no progress records are found for the user, create them
            if (userQuestProgressRecords.length === 0) {
                const newProgressRecords = quests.map(quest => ({
                    userId,
                    questId: quest.id,
                    progress: 0,
                    expReceived: false
                }));

                await db.userQuestProgress.createMany({
                    data: newProgressRecords
                });

                userQuestProgressRecords = await db.userQuestProgress.findMany({
                    where: {
                        userId
                    }
                });

                console.log("New user quest progress records created:", newProgressRecords);
            } else {
                // Convert the progress records into a map for easy access
                const userQuestProgress = userQuestProgressRecords.reduce((acc, record) => {
                    acc[record.questId] = record;
                    return acc;
                }, {} as Record<number, { id: number, progress: number, expReceived: boolean }>);

                // Grant exp and update progress for running the command
                const userQuest1Progress = userQuestProgress[questId];

                if (userQuest1Progress) {
                    // Update user's progress
                    const updatedProgress = Math.min(userQuest1Progress.progress + expAmount, quests[questId - 1].goal);
                    console.log(`Updating progress for user ${userId}, quest ${questId} to ${updatedProgress}`);

                    await db.userQuestProgress.update({
                        where: {
                            id: userQuest1Progress.id
                        },
                        data: {
                            progress: updatedProgress // Update progress with exp
                        }
                    });
                    console.log("User quest progress updated successfully.", {
                        id: userQuest1Progress.id,
                        progress: updatedProgress
                    });

                    await interaction.channel?.send(`You have received ${expAmount} exp for running the command!`);
                }
            }

            // Prepare embed for displaying quests and progress
            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("Daily Quests")
                .setDescription("Check your daily quests and progress:");

            // Build quest entries in the embed
            quests.forEach(quest => {
                const progress = userQuestProgressRecords.find(record => record.questId === quest.id)?.progress || 0;
                const progressBar = buildProgressBar(progress, quest.goal, quest.progressBarLength);

                embed.addFields({
                    name: `${quest.description} (${progress}/${quest.goal})`,
                    value: `Rewards: ${quest.reward}\n${progressBar}`
                });
            });

            // Send the embed to the user
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error fetching quests:", error);
            await interaction.reply("An error occurred while fetching quests.");
        }
    });

// Helper function to build the progress bar
function buildProgressBar(current: number, total: number, barLength: number): string {
    const progressPercent = Math.min((current / total) * 100, 100);
    const progressBars = Math.floor((progressPercent / 100) * barLength);

    const frontBarEmoji = "<:front1:1238694467951792128>";
    const middleBarEmoji = "<:middle1:1238694485584773140>";
    const backBarEmoji = "<:back1:1238694502949064764>";

    const progressBar =
        frontBarEmoji.repeat(progressBars) +
        (progressBars < barLength ? middleBarEmoji : "") +
        backBarEmoji.repeat(barLength - progressBars - 1);

    return `${progressBar} ${progressPercent.toFixed(0)}%`;
}
