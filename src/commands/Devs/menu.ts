/* eslint-disable indent */
import {permissions} from "../../providers/permissions";
import {EmbedBuilder} from "discord.js";
import {db} from "../../database/database";
import {ExtendedCommand} from "../../structures/extendedCommand";

export const command = new ExtendedCommand({ name: "menu", description: "Manage menu Items.", local: true })
    .addPermission(permissions.developer)
    .addSubCommand((subcommand) =>
        subcommand
            .setName("add") 
            .setDescription("Add a new menu item.")
            .addStringOption((option) =>
                option
                    .setName("name")
                    .setDescription("Name of the menu item.")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("description")
                    .setDescription("Description of the menu item.")
                    .setRequired(true)
            )
            .addNumberOption((option) =>
                option
                    .setName("price")
                    .setDescription("Price of the menu item.")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("category")
                    .setDescription("Category of the menu item.")
                    .setRequired(true)
            )
    )
    .addSubCommand((subcommand) =>
        subcommand
            .setName("remove")
            .setDescription("Remove a menu item.")
            .addStringOption((option) =>
                option
                    .setName("id")
                    .setDescription("ID of the menu item to remove.")
                    .setRequired(true) // ID is required to remove an item
            )
    )
    .addSubCommand((subcommand) =>
        subcommand
            .setName("update")
            .setDescription("Update details of a menu item.")
            .addStringOption((option) =>
                option
                    .setName("id")
                    .setDescription("ID of the menu item to update.")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("name")
                    .setDescription("New name of the menu item.")
            )
            .addStringOption((option) =>
                option
                    .setName("description")
                    .setDescription("New description of the menu item.")
            )
            .addNumberOption((option) =>
                option
                    .setName("price")
                    .setDescription("New price of the menu item.")
            )
            .addStringOption((option) =>
                option
                    .setName("category")
                    .setDescription("New category of the menu item.")
            )
    )
    .addSubCommand((subcommand) =>
        subcommand
            .setName("list")
            .setDescription("List all menu items.")
    )
	.setExecutor(async (int) => {
        const subcommand = int.options.getSubcommand(true);

        if (subcommand === "add") {
            // Logic for adding a new menu item
            const name = int.options.getString("name", true);
            const description = int.options.getString("description", true);
            const price = int.options.getNumber("price", true);
            const category = int.options.getString("category", true);

            try {
                // Get the highest existing ID from the database
                const maxIdResult = await db.menuItem.findFirst({
                    select: {
                        id: true,
                    },
                    orderBy: {
                        id: "desc",
                    },
                });

                let newId = 1; // Default ID if no items exist in the database
                if (maxIdResult) {
                    // If there are existing items, increment the highest ID by 1
                    newId = parseInt(maxIdResult.id) + 1;
                }

                await db.menuItem.create({
                    data: {
                        id: newId.toString(), // Convert newId to a string
                        name,
                        description,
                        price,
                        category,
                    },
                });

                await int.reply("Menu item added successfully.");
            } catch (error) {
                console.error("Error adding menu item:", error);
                await int.reply("An error occurred while adding the menu item.");
            }
        } else if (subcommand === "remove") {
            // Logic for removing a menu item
            const itemId = int.options.getString("id", true);

            try {
                // Check if the menu item exists
                const existingMenuItem = await db.menuItem.findUnique({
                    where: {
                        id: itemId,
                    },
                });

                if (!existingMenuItem) {
                    await int.reply("Menu item not found.");
                    return;
                }

                // Remove the menu item from the database
                await db.menuItem.delete({
                    where: {
                        id: itemId,
                    },
                });

                await int.reply("Menu item removed successfully.");
            } catch (error) {
                console.error("Error removing menu item:", error);
                await int.reply("An error occurred while removing the menu item.");
            }
        } else if (subcommand === "update") {
            // Logic for updating details of a menu item
            const itemId = int.options.getString("id", true);
            const name = int.options.getString("name");
            const description = int.options.getString("description");
            const price = int.options.getNumber("price");
            const category = int.options.getString("category");

            try {
                // Check if the menu item exists
                const existingMenuItem = await db.menuItem.findUnique({
                    where: {
                        id: itemId,
                    },
                });

                if (!existingMenuItem) {
                    await int.reply("Menu item not found.");
                    return;
                }

                // Update the menu item in the database
                await db.menuItem.update({
                    where: {
                        id: itemId,
                    },
                    data: {
                        name: name || existingMenuItem.name,
                        description: description || existingMenuItem.description,
                        price: price || existingMenuItem.price,
                        category: category || existingMenuItem.category,
                    },
                });

                await int.reply("Menu item updated successfully.");
            } catch (error) {
                console.error("Error updating menu item:", error);
                await int.reply("An error occurred while updating the menu item.");
            }
        } else if (subcommand === "list") {
            // Logic for listing all menu items
            try {
                const menuItems = await db.menuItem.findMany();
                if (menuItems.length === 0) {
                    await int.reply("No menu items found.");
                    return;
                }

                const itemList = menuItems.map(item => `- ID: ${item.id}, Name: ${item.name}, Price: $${item.price.toFixed(2)}, Category: ${item.category}`);
                const embed = new EmbedBuilder()
                    .setTitle("Menu Items")
                    .setDescription(itemList.join("\n"))
                    .setColor("#00FF00")
                    .toJSON();

                await int.reply({ embeds: [embed] });
            } catch (error) {
                console.error("Error fetching menu items:", error);
                await int.reply("An error occurred while fetching menu items.");
            }
        } else {
            // Handle other subcommands
            await int.reply("This subcommand is not yet implemented.");
        }
    });
