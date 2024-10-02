/* eslint-disable indent */
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database"; // Prisma database functions
import { permissions } from "../../providers/permissions"; // Assuming you have permissions defined
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand({ name: "dadd", description: "Manage drink images." })
    .addSubCommand(subcommand =>
        subcommand
            .setName("add")
            .setDescription("Add a new drink image.")
            .addStringOption(option =>
                option.setName("name").setDescription("The name of the drink.").setRequired(true)
            )
            .addStringOption(option =>
                option.setName("url").setDescription("The URL of the drink image.").setRequired(true)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("remove")
            .setDescription("Remove a drink image.")
            .addStringOption(option =>
                option.setName("name").setDescription("The name of the drink to remove.").setRequired(true)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("edit")
            .setDescription("Edit the URL of an existing drink image.")
            .addStringOption(option =>
                option.setName("name").setDescription("The name of the drink.").setRequired(true)
            )
            .addStringOption(option =>
                option.setName("url").setDescription("The new URL of the drink image.").setRequired(true)
            )
    )
    .addPermission(permissions.developer)
    .setExecutor(async (interaction: CommandInteraction) => {
        try {
            const subCommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand(true);

            switch (subCommand) {
                case "add": {
                    const name = (interaction.options as CommandInteractionOptionResolver).getString("name", true).toLowerCase();
                    const url = (interaction.options as CommandInteractionOptionResolver).getString("url", true);

                    // Check if the drink image already exists
                    const existingImage = await db.drinkImage.findUnique({
                        where: { drinkName: name },
                    });

                    if (existingImage) {
                        await interaction.reply(`A drink image for "${name}" already exists.`);
                        return;
                    }

                    await db.drinkImage.create({
                        data: { drinkName: name, url: url },
                    });

                    await interaction.reply(`The drink image for "${name}" has been added.`);
                    break;
                }
                case "remove": {
                    const name = (interaction.options as CommandInteractionOptionResolver).getString("name", true).toLowerCase();

                    // Check if the drink image exists
                    const existingImage = await db.drinkImage.findUnique({
                        where: { drinkName: name },
                    });

                    if (!existingImage) {
                        await interaction.reply(`No image found for the drink "${name}".`);
                        return;
                    }

                    await db.drinkImage.delete({
                        where: { drinkName: name },
                    });

                    await interaction.reply(`The drink image for "${name}" has been removed.`);
                    break;
                }
                case "edit": {
                    const name = (interaction.options as CommandInteractionOptionResolver).getString("name", true).toLowerCase();
                    const url = (interaction.options as CommandInteractionOptionResolver).getString("url", true);

                    // Check if the drink image exists
                    const existingImage = await db.drinkImage.findUnique({
                        where: { drinkName: name },
                    });

                    if (!existingImage) {
                        await interaction.reply(`No image found for the drink "${name}".`);
                        return;
                    }

                    await db.drinkImage.update({
                        where: { drinkName: name },
                        data: { url: url },
                    });

                    await interaction.reply(`The drink image for "${name}" has been updated.`);
                    break;
                }
                default:
                    await interaction.reply("Invalid subcommand.");
                    break;
            }
        } catch (error) {
            console.error("Error handling subcommand:", error);
            await interaction.reply("An error occurred while processing the command.");
        }
    });
