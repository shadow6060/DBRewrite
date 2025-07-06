/* eslint-disable indent */
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database"; // Replace with your database functions
import { permissions } from "../../providers/permissions"; // Assuming you have permissions defined
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand({ name: "bi", description: "Manage blacklisted items.", local: true })
    .addPermission(permissions.developer)
    .setCategory("🔐 Editing")
    .addSubCommand((subcommand) =>
        subcommand
            .setName("add")
            .setDescription("Add an item to the blacklist.")
            .addStringOption((option) =>
                option.setName("item").setDescription("The item to blacklist.").setRequired(true)
            )
    )
    .addSubCommand((subcommand) =>
        subcommand
            .setName("remove")
            .setDescription("Remove an item from the blacklist.")
            .addStringOption((option) =>
                option.setName("item").setDescription("The item to remove from blacklist.").setRequired(true)
            )
    )
    .setExecutor(async (interaction: CommandInteraction) => {
        try {
            const subCommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand(true);

            switch (subCommand) {
                case "add": {
                    const item = (interaction.options as CommandInteractionOptionResolver).getString("item", true).toLowerCase();

                    // Check if the item is already in the blacklist
                    const existingItem = await db.blacklistItem.findUnique({
                        where: { name: item },
                    });

                    if (existingItem) {
                        await interaction.reply(`Item "${item}" is already in the blacklist.`);
                        return;
                    }

                    await db.blacklistItem.create({
                        data: { name: item },
                    });

                    await interaction.reply(`Item "${item}" has been added to the blacklist.`);
                    break;
                }
                case "remove": {
                    const item = (interaction.options as CommandInteractionOptionResolver).getString("item", true).toLowerCase();

                    // Check if the item is in the blacklist
                    const existingItem = await db.blacklistItem.findUnique({
                        where: { name: item },
                    });

                    if (!existingItem) {
                        await interaction.reply(`Item "${item}" is not in the blacklist.`);
                        return;
                    }

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
