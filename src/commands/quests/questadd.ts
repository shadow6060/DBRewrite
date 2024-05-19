/* eslint-disable indent */
import { CommandInteraction } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database";
import { permissions } from "../../providers/permissions";
import { ExtendedCommand } from "../../structures/extendedCommand";
import { CommandInteractionOptionResolver } from "discord.js";

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
            const options = interaction.options as CommandInteractionOptionResolver; // Type assertion

            const description = options.getString("description");
            const creditsOption = options.getNumber("credits");
            const credits = creditsOption !== null ? parseInt(creditsOption.toString(), 10) : 0;
            const goalOption = options.getNumber("goal");
            const goal = goalOption !== null ? parseInt(goalOption.toString(), 10) : 0;
            const rewardOption = options.getString("reward");
            const reward = rewardOption !== null ? rewardOption : "";
            const progressBarLengthOption = options.getNumber("progressbarlength");
            const progressBarLength = progressBarLengthOption !== null ? parseInt(progressBarLengthOption.toString(), 10) : 10;

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
