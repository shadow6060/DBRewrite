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
    .addNumberOption("credits", "Number of credits rewarded for completing the quest.", true) // Add the credits option
    .setExecutor(async (interaction: CommandInteraction) => {
        try {
            // Get the ID of the last quest in the database
            const lastQuest = await db.quest.findFirst({
                orderBy: { id: "desc" }, // Order by ID in descending order to get the last quest
            });

            let nextId = 1; // Default next ID if there are no quests in the database
            if (lastQuest) {
                // If there is a last quest, increment its ID to determine the next ID
                nextId = lastQuest.id + 1;
            }

            // Access the description option
            const description = interaction.options.getString("description") || "";

            // Access the credits option, default to 0 if not provided
            const credits = interaction.options.getNumber("credits") || 0;

            // Add the new quest to the database
            await db.quest.create({
                data: {
                    id: nextId, // Set the ID for the new quest
                    description,
                    completed: false,
                    userId: interaction.user.id,
                    resources: 0, // Set a default value for resources
                    rewards: credits, // Assign the specified credits as rewards
                },
            });

            await interaction.reply("New quest added successfully.");
        } catch (error) {
            console.error("Error adding quest:", error);
            await interaction.reply("An error occurred while adding the quest.");
        }
    });
