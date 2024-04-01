/* eslint-disable indent */
import { db } from "../../database/database";
import { generateOrderId, OrderStatus } from "../../database/orders";
import { text } from "../../providers/config";
import { mainChannels, mainRoles } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import { CommandInteraction, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { getUserInfo, updateBalance } from "../../database/userInfo";
import { client } from "../../providers/client";

// Map to store active orders by user ID
const activeOrders = new Map<string, boolean>();

// Cached menu items
let cachedMenuItems: any[] = [];

export const command = new Command("order", "Orders a drink.")
    .setExecutor(async (int: CommandInteraction) => {
        // Check if the user already has an active order
        if (activeOrders.has(int.user.id)) {
            await int.reply(text.commands.order.exists);
            return;
        }

        // Check if the channel has the "Embed Links" permission enabled
        if (!int.channel.permissionsFor(int.client.user).has("EmbedLinks")) {
            await int.reply("This channel doesn't have Embed Links enabled. You can't place an order here.");
            return;
        }

        // Fetch menu items if not cached
        if (!cachedMenuItems.length) {
            cachedMenuItems = await getDropdownOptions();
        }

        // If there are no options available, inform the user and return
        if (cachedMenuItems.length === 0) {
            await int.reply("There are no options available to select.");
            return;
        }

        // Create a StringSelectMenuBuilder for the dropdown menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("order_item")
            .setPlaceholder("Select a drink");

        // Add options to the dropdown menu
        cachedMenuItems.forEach(option => {
            selectMenu.addOptions(option);
        });

        // Create an action row with the dropdown menu
        const actionRow = {
            type: ComponentType.ActionRow,
            components: [selectMenu],
        };

        // Create an embed with instructions
        const embed = new EmbedBuilder()
            .setDescription("Please select a drink.")
            .setColor("#00FF00");

        // Reply to the interaction with the embed and dropdown menu
        try {
            await int.reply({
                embeds: [embed],
                components: [actionRow],
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error replying to interaction:", error);
        }
    });

// Function to fetch options for the dropdown menu including menu items and their prices
async function getDropdownOptions() {
    try {
        // Fetch menu items and their prices from the database
        const menuItems = await db.menuItem.findMany();

        // Map menu items to options for the dropdown menu
        const options = menuItems.map(item => ({
            label: `📔 ${item.name}  💲 ${item.price.toFixed(2)}`, // Name of the menu item with price, all in bold
            value: item.name, // Use the name of the menu item as the value
            description: `Description: 📝 ${item.description}`, // Description of the menu item
            price: item.price, // Include the price in the option object
        }));
        return options;
    } catch (error) {
        console.error("Error fetching menu items:", error);
        return []; // Return an empty array in case of error
    }
}

// Handle interaction for order selection
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const componentId = interaction.customId;
    if (componentId === "order_item") {
        // Check if the user already has an active order
        const userId = interaction.user.id;
        if (activeOrders.has(userId)) {
            await interaction.reply(text.commands.order.exists);
            return;
        }

        // Disable the dropdown menu to prevent further selections
        const selectMenu = interaction.message.components?.find(component => component.type === ComponentType.ActionRow)?.components
            .find(component => component.customId === "order_item");
        if (selectMenu && selectMenu instanceof StringSelectMenuBuilder) {
            selectMenu.setDisabled(true);
        }

        const selectedItem = cachedMenuItems.find(item => item.value === interaction.values[0]);
        if (!selectedItem) {
            console.error("Selected menu item not found.");
            return;
        }

        const drink = selectedItem.value; // Assuming only one drink can be selected
        const orderId = await generateOrderId(); // Generate a unique order ID

        // Fetch user's balance
        const userInfo = await getUserInfo(userId);

        // Check if the user has enough balance
        if (userInfo.balance < selectedItem.price) {
            await interaction.reply("You don't have enough balance to order this item.");
            return;
        }

        // Deduct the cost of the ordered item from the user's balance
        const newBalance = userInfo.balance - selectedItem.price;

        // Update user's balance in the database
        await updateBalance(userId, newBalance, 0); // Provide a default value for newDonuts
        // Updated to match the new function signature
        // Create the order
        const order = await db.orders.create({
            data: {
                id: orderId,
                user: userId,
                details: drink,
                channel: interaction.channelId,
                guild: interaction.guildId,
                status: OrderStatus.Unprepared, // Initial status set to PendingDelivery
            },
        });

        try {
            // Attempt to send the "Order has been placed successfully" message directly to the user
            const embed = new EmbedBuilder()
                .setTitle("Order Placement")
                .setColor("Random") //default 0099ff
                .addFields(
                    { name: "Order Details", value: `Your order with ID ${order.id} | ${drink}\nStatus: Has been placed successfully` }
                );
            await interaction.user.send({ embeds: [embed] });
        } catch (error) {
            // Handle the error if sending the message fails due to closed DMs
            await interaction.reply("Your DMs are closed. Please enable them to receive the order confirmation.");
            return;
        }

        const updatedUserInfo = await getUserInfo(userId);
        await interaction.reply(`You have purchased ${drink} and your balance is now ${updatedUserInfo.balance}.`);

        if (interaction.member?.nickname?.toLowerCase() === "bart") {
            await interaction.followUp("I will end you");
        }

        await mainChannels.brewery.send(
            format(text.commands.order.created, {
                details: drink,
                duty: mainRoles.duty.toString(),
                id: order.id,
                tag: interaction.user.username,
            })
        );

        // Mark the user as having an active order
        activeOrders.set(userId, true
        );

        // Remove the user from activeOrders after 30 seconds if their order is not cancelled or deleted
        setTimeout(() => {
            if (activeOrders.has(userId)) {
                activeOrders.delete(userId);
            }
        }, 30000); // 30 seconds timeout for non-cancelled or non-deleted orders
    }
});
