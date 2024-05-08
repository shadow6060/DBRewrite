/* eslint-disable indent */
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database";

// Custom emojis for the progress bar
const filledBarEmoji = ":blue_square:";
const emptyBarEmoji = ":white_large_square:";
const progressBarLength = 10;
const maxResourceValue = 1000; // Define the maximum value for the resources

export const command = new Command("dailyquest", "View your daily quests.")
    .setExecutor(async (interaction: CommandInteraction) => {
        // Fetch user's daily quests from the database
        const userId = interaction.user.id;
        const userQuests = await db.quest.findMany({
            where: {
                userId,
            },
        });

        // Format quests into a message or embed
        const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("Daily Quests")
            .setDescription("Here are your daily quests:")
            .addFields(
                userQuests.map((quest, index) => ({
                    name: `Quest ${index + 1}`,
                    value: `**${quest.description}**\n${generateProgressBar(quest.resources)}\nRewards: ${formatRewards(quest.rewards)}`,
                }))
            );

        // Send the formatted quests embed to the user
        await interaction.reply({ embeds: [embed] });
    });

function generateProgressBar(resources: number): string {
    const filledBars = Math.round((resources / maxResourceValue) * progressBarLength);
    const emptyBars = progressBarLength - filledBars;

    // Construct the progress bar string using filled and empty bar emojis
    return `${filledBarEmoji.repeat(filledBars)}${emptyBarEmoji.repeat(emptyBars)} (${resources}/${maxResourceValue})`;
}

function formatRewards(rewards: number | null): string {
    if (rewards === null) {
        return "No rewards"; // Handle the case where rewards are not specified
    }
    // Format rewards based on your currency system
    // For example, if you're using credits as currency:
    return `${rewards} credits`;
}
