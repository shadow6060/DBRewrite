/* eslint-disable indent */
import { CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database"; // Replace with your database functions
import { permissions } from "../../providers/permissions"; // Assuming you have permissions defined
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand({ name: "bi", description: "Manage blacklisted items.", local: true })
    .addSubCommand(subcommand =>
        subcommand
            .setName("add")
            .setDescription("Add an item to the blacklist.")
            .addStringOption(option =>
                option.setName("item").setDescription("The item to blacklist.").setRequired(true)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("remove")
            .setDescription("Remove an item from the blacklist.")
            .addStringOption(option =>
                option.setName("item").setDescription("The item to remove from blacklist.").setRequired(true)
            )
    )
    .setExecutor(async (interaction: CommandInteraction) => {
        try {
            const subCommand = interaction.options.getSubcommand(true);

            switch (subCommand) {
                case "add": {
                    const item = (interaction.options as CommandInteractionOptionResolver<never>).getString("item", true).toLowerCase();

                    await db.blacklistItem.create({
                        data: { name: item },
                    });

                    await interaction.reply(`Item "${item}" has been added to the blacklist.`);
                    break;
                }
                case "remove": {
                    const item = (interaction.options as CommandInteractionOptionResolver<never>).getString("item", true).toLowerCase();

                    await db.blacklistItem.delete({
                        where: { name: item },
                    });

                    await interaction.reply(`Item "${item}" has been removed from the blacklist.`);
                    break;
                }
                default:
                    await interaction.reply("Invalid subcommand.");
                    break;
            }
        } catch (error) {
            console.error("Error handling subcommand:", error);
            await interaction.reply("An error occurred while processing the subcommand.");
        }
    });
