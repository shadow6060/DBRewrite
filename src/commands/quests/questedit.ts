/* eslint-disable indent */
import { CommandInteraction } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database";
import { permissions } from "../../providers/permissions";
import { ExtendedCommand } from "../../structures/extendedCommand";
import { EmbedBuilder } from "discord.js";

async function resetQuestNumbering() {
    const quests = await db.quest.findMany();

    for (let i = 0; i < quests.length; i++) {
        await db.quest.update({
            where: {
                id: quests[i].id,
            },
            data: {
                number: i + 1,
            },
        });
    }
}

export const command = new ExtendedCommand(
    { name: "questedit", description: "Edit or remove an existing quest.", local: true }
)
    .addPermission(permissions.developer)
    .addSubCommand(subcommand =>
        subcommand
            .setName("edit")
            .setDescription("Edit an existing quest.")
            .addStringOption(option =>
                option.setName("id")
                    .setDescription("ID of the quest to edit.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName("description")
                    .setDescription("New description for the quest.")
                    .setRequired(true)
            )
            .addNumberOption(option =>
                option.setName("credits")
                    .setDescription("New number of credits rewarded for completing the quest.")
                    .setRequired(true)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("delete")
            .setDescription("Delete an existing quest.")
            .addStringOption(option =>
                option.setName("id")
                    .setDescription("ID of the quest to delete.")
                    .setRequired(true)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("list")
            .setDescription("List all existing quests.")
    )
    .setExecutor(async (interaction: CommandInteraction) => {
        const subCommand = interaction.options.getSubcommand(true);

        try {
            if (subCommand === "edit") {
                // Editing logic
            } else if (subCommand === "delete") {
                const questId = parseInt(interaction.options.getString("id", true));
                await db.quest.delete({
                    where: {
                        id: questId,
                    },
                });

                const remainingQuests = await db.quest.count();

                if (remainingQuests === 0) {
                    await resetQuestNumbering();
                }

                await interaction.reply("Quest deleted successfully.");
            } else if (subCommand === "list") {
                const quests = await db.quest.findMany();
                const embed = new EmbedBuilder()
                    .setTitle("List of Quests")
                    .setDescription("Here are all existing quests:");

                quests.forEach((quest, index) => {
                    const questField = {
                        name: `Quest ${index + 1}`,
                        value: `ID: ${quest.id}\nDescription: ${quest.description}\nRewards: ${quest.rewards}`
                    };
                    embed.addFields(questField);
                });

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply("Invalid subcommand.");
            }
        } catch (error) {
            console.error("Error handling subcommand:", error);
            await interaction.reply("An error occurred while processing the subcommand.");
        }
    });
