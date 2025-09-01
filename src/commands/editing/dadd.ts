/* eslint-disable indent */
import { ChatInputCommandInteraction } from "discord.js";
import { ExtendedCommand } from "../../structures/extendedCommand";
import { db } from "../../database/database";
import { permissions } from "../../providers/permissions";

export const command = new ExtendedCommand({
    name: "dadd",
    description: "Manage drink images.",
    local: true,
})
    .addPermission(permissions.developer)
    .setCategory("🔐 Editing")
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
            .addIntegerOption(option =>
                option.setName("price").setDescription("The price of the drink (optional).").setRequired(false)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("remove")
            .setDescription("Remove a specific drink image.")
            .addStringOption(option =>
                option.setName("name").setDescription("The name of the drink to remove.").setRequired(true)
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
                option.setName("new_url").setDescription("The new URL of the drink image.").setRequired(true)
            )
            .addStringOption(option =>
                option.setName("category").setDescription("The category of the drink.").setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName("price").setDescription("The new price of the drink (optional).").setRequired(false)
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
    .addSubCommand(subcommand =>
        subcommand
            .setName("show")
            .setDescription("Show all drink images with their id, name, category, and price.")
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("batchadd")
            .setDescription("Add multiple drink images in batch.")
            .addStringOption(option =>
                option.setName("batch")
                    .setDescription("Add multiple drinks in format: name | url | category | price (separated by commas).")
                    .setRequired(true)
            )
    )
    .setExecutor(async (interaction: ChatInputCommandInteraction) => {
        try {
            const subCommand = interaction.options.getSubcommand(true);

            switch (subCommand) {
                case "add": {
                    const name = interaction.options.getString("name", true).toLowerCase();
                    const url = interaction.options.getString("url", true);
                    const category = interaction.options.getString("category", true).toLowerCase();
                    const price = interaction.options.getInteger("price") ?? null;

                    const existingImage = await db.drinkImage.findFirst({
                        where: { drinkName: name, url, category },
                    });

                    if (existingImage) {
                        await interaction.reply(`❌ This image already exists for **${name}** in the category **${category}**.`);
                        return;
                    }

                    await db.drinkImage.create({
                        data: { drinkName: name, url, category, price },
                    });

                    await interaction.reply(`✅ Added a new image for **${name}** in category **${category}**.`);
                    break;
                }

                case "remove": {
                    const name = interaction.options.getString("name", true).toLowerCase();

                    const existingImage = await db.drinkImage.findFirst({
                        where: { drinkName: name },
                    });

                    if (!existingImage) {
                        await interaction.reply(`❌ No image found for **${name}**.`);
                        return;
                    }

                    await db.drinkImage.delete({ where: { id: existingImage.id } });

                    await interaction.reply(`🗑️ Removed the image for **${name}**.`);
                    break;
                }

                case "edit": {
                    const name = interaction.options.getString("name", true).toLowerCase();
                    const newUrl = interaction.options.getString("new_url", true);
                    const category = interaction.options.getString("category", true).toLowerCase();
                    const price = interaction.options.getInteger("price") ?? null;

                    const existingImage = await db.drinkImage.findFirst({
                        where: { drinkName: name, category },
                    });

                    if (!existingImage) {
                        await interaction.reply(`❌ No image found for **${name}** in category **${category}**.`);
                        return;
                    }

                    await db.drinkImage.update({
                        where: { id: existingImage.id },
                        data: { url: newUrl, price },
                    });

                    await interaction.reply(`✅ Updated the image URL and price for **${name}** in category **${category}**.`);
                    break;
                }

                case "preview": {
                    const name = interaction.options.getString("name", true).toLowerCase();

                    const image = await db.drinkImage.findFirst({
                        where: { drinkName: name },
                        select: { url: true, price: true },
                    });

                    if (!image) {
                        await interaction.reply(`❌ No image found for **${name}**.`);
                        return;
                    }

                    await interaction.reply({
                        embeds: [
                            {
                                title: `Preview for: ${name}`,
                                description: `Price: ${image.price ? `$${image.price / 100}` : "Not set"}`,
                                image: { url: image.url },
                                color: 0x00bfff,
                                timestamp: new Date().toISOString(),
                                footer: { text: "Drink preview" },
                            },
                        ],
                    });
                    break;
                }

                case "show": {
                    const drinks = await db.drinkImage.findMany({
                        select: { id: true, drinkName: true, category: true, price: true },
                    });

                    if (drinks.length === 0) {
                        await interaction.reply("❌ No drink images found.");
                        return;
                    }

                    const embed = {
                        title: "Drink Images",
                        description: "Here are all the available drinks with their IDs, names, categories, and prices:",
                        color: 0x00bfff,
                        fields: drinks.map(drink => ({
                            name: drink.drinkName,
                            value: `ID: ${drink.id} | Category: ${drink.category} | Price: ${drink.price ? `$${drink.price / 100}` : "Not set"}`,
                            inline: true,
                        })),
                        timestamp: new Date().toISOString(),
                    };

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case "batchadd": {
                    const batchInput = interaction.options.getString("batch", true);
                    const lines = batchInput.split(",").map(line => line.trim()).filter(Boolean);

                    const results = await Promise.all(lines.map(async line => {
                        const [nameRaw, urlRaw, categoryRaw, priceRaw] = line.split("|").map(p => p?.trim());

                        if (!nameRaw || !urlRaw || !categoryRaw) {
                            return `❌ Invalid: \`${line}\``;
                        }

                        const name = nameRaw.toLowerCase();
                        const url = urlRaw;
                        const category = categoryRaw.toLowerCase();
                        const price = priceRaw ? parseInt(priceRaw) : null;

                        const exists = await db.drinkImage.findFirst({ where: { drinkName: name } });
                        if (exists) {
                            return `⚠️ Skipped existing: **${name}**`;
                        }

                        await db.drinkImage.create({ data: { drinkName: name, url, category, price } });
                        return `✅ Added: **${name}**`;
                    }));

                    await interaction.reply(results.join("\n"));
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
