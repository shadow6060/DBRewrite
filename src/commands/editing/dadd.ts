/* eslint-disable indent */
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database";
import { permissions } from "../../providers/permissions";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand({ name: "dadd", description: "Manage drink images.", local: true })
    .addPermission(permissions.developer)
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
            .addStringOption(option =>
                option.setName("category").setDescription("The category of the drink.").setRequired(true)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("remove")
            .setDescription("Remove a specific drink image.")
            .addStringOption(option =>
                option.setName("name").setDescription("The name of the drink.").setRequired(true)
            )
            .addStringOption(option =>
                option.setName("url").setDescription("The URL of the drink image to remove.").setRequired(true)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("edit")
            .setDescription("Edit an existing drink image.")
            .addStringOption(option =>
                option.setName("name").setDescription("The name of the drink.").setRequired(true)
            )
            .addStringOption(option =>
                option.setName("old_url").setDescription("The old URL to replace.").setRequired(true)
            )
            .addStringOption(option =>
                option.setName("new_url").setDescription("The new URL of the drink image.").setRequired(true)
            )
            .addStringOption(option =>
                option.setName("category").setDescription("The category of the drink.").setRequired(true)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("preview")
            .setDescription("Preview a drink image by name.")
            .addStringOption(option =>
                option.setName("name").setDescription("The name of the drink to preview.").setRequired(true)
            )
    )
    .setExecutor(async (interaction: CommandInteraction) => {
        try {
            const subCommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand(true);

            switch (subCommand) {
                case "add": {
                    const name = (interaction.options as CommandInteractionOptionResolver).getString("name", true).toLowerCase();
                    const url = (interaction.options as CommandInteractionOptionResolver).getString("url", true);
                    const category = (interaction.options as CommandInteractionOptionResolver).getString("category", true).toLowerCase();

                    const existingImage = await db.drinkImage.findFirst({
                        where: { drinkName: name, url: url, category: category },
                    });

                    if (existingImage) {
                        await interaction.reply(`❌ This image already exists for **${name}** in the category **${category}**.`);
                        return;
                    }

                    await db.drinkImage.create({
                        data: { drinkName: name, url: url, category: category },
                    });

                    await interaction.reply(`✅ Added a new image for **${name}** in category **${category}**.`);
                    break;
                }

                case "remove": {
                    const name = (interaction.options as CommandInteractionOptionResolver).getString("name", true).toLowerCase();
                    const url = (interaction.options as CommandInteractionOptionResolver).getString("url", true);

                    const existingImage = await db.drinkImage.findFirst({
                        where: { drinkName: name, url: url },
                    });

                    if (!existingImage) {
                        await interaction.reply(`❌ No image found for **${name}** with the specified URL.`);
                        return;
                    }

                    await db.drinkImage.delete({
                        where: { id: existingImage.id },
                    });

                    await interaction.reply(`🗑️ Removed the specified image for **${name}**.`);
                    break;
                }

                case "edit": {
                    const name = (interaction.options as CommandInteractionOptionResolver).getString("name", true).toLowerCase();
                    const oldUrl = (interaction.options as CommandInteractionOptionResolver).getString("old_url", true);
                    const newUrl = (interaction.options as CommandInteractionOptionResolver).getString("new_url", true);
                    const category = (interaction.options as CommandInteractionOptionResolver).getString("category", true).toLowerCase();

                    const existingImage = await db.drinkImage.findFirst({
                        where: { drinkName: name, url: oldUrl, category: category },
                    });

                    if (!existingImage) {
                        await interaction.reply(`❌ No image found for **${name}** in category **${category}** with the specified old URL.`);
                        return;
                    }

                    await db.drinkImage.update({
                        where: { id: existingImage.id },
                        data: { url: newUrl },
                    });

                    await interaction.reply(`✅ Updated the image URL for **${name}** in category **${category}**.`);
                    break;
                }

                case "preview": {
                    const name = (interaction.options as CommandInteractionOptionResolver).getString("name", true).toLowerCase();

                    const image = await db.drinkImage.findFirst({
                        where: { drinkName: name },
                        select: { url: true },
                    });

                    if (!image) {
                        await interaction.reply(`❌ No image found for **${name}**.`);
                        return;
                    }

                    await interaction.reply({
                        embeds: [
                            {
                                title: `Preview for: ${name}`,
                                image: { url: image.url },
                                color: 0x00bfff,
                                timestamp: new Date().toISOString(),
                                footer: { text: "Drink preview" },
                            },
                        ],
                    });
                    break;
                }

                default:
                    await interaction.reply("❌ Invalid subcommand.");
            }
        } catch (error) {
            console.error("Error executing command:", error);
            await interaction.reply("❌ An error occurred while processing your request.");
        }
    });
