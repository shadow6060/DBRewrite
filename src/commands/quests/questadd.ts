/* eslint-disable indent */
import { CommandInteraction } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database";
import { permissions } from "../../providers/permissions";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand(
    { name: "questadd", description: "Add a new quest.", local: true }
)
    .addPermission(permissions.developer)
    .addStringOption("description", "Description of the new quest.", true)
    .addNumberOption("credits", "Number of credits rewarded for completing the quest.", true)
    .addNumberOption("goal", "Number of tasks to complete for this quest.", true)
    .addStringOption("reward", "Reward for completing the quest.", true)
    .addNumberOption("progressbarlength", "Length of the progress bar for this quest.", true) // Add the progressBarLength option
    .setExecutor(async (interaction: CommandInteraction) => {
        try {
            const description = interaction.options.getString("description");
            const credits = interaction.options.getNumber("credits") || 0;
            const goal = interaction.options.getNumber("goal") || 0;
            const reward = interaction.options.getString("reward") || "";
            const progressBarLength = interaction.options.getNumber("progressbarlength") || 10; // Default to 10 if not provided

            await db.quest.create({
                data: {
                    description: description || "",
                    credits,
                    goal,
                    reward: reward || "",
                    progressBarLength, // Use the obtained progressBarLength
                }
            });

            await interaction.reply("New quest added successfully.");
        } catch (error) {
            console.error("Error adding quest:", error);
            await interaction.reply("An error occurred while adding the quest.");
        }
    });
