/* eslint-disable indent */
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { Command } from "../../../structures/Command";
import { permissions } from "../../../providers/permissions";
import { OrderStatus, getClaimedOrder } from "../../../database/orders";
import { db } from "../../../database/database";
import { text } from "../../../providers/config";
import { client } from "../../../providers/client";
import { CommandInteraction, StringSelectMenuBuilder, ComponentType, EmbedBuilder } from "discord.js";

const claimedOrderLocks = new Map<string, boolean>();  // Map to store claim locks for each order ID
const claimedOrders = new Set<string>();  // Set to store claimed order IDs

export const command = new Command("claim", "Claims an order.")
    .addPermission(permissions.employee)
    .setExecutor(async (int: CommandInteraction) => {
        if (await getClaimedOrder(int.user)) {
            await int.reply({ content: text.commands.claim.existing, ephemeral: false });
            return;
        }

        const orders = await db.orders.findMany({
            where: {
                status: OrderStatus.Unprepared,
            },
            select: {
                id: true,
                user: true,
                details: true,
            },
        });

        if (orders.length === 0) {
            await int.reply({ content: "There are no available orders to claim.", ephemeral: true });
            return;
        }

        const options = orders.map(order => {
            const details = order.details.length > 50 ? `${order.details.substring(0, 47)}...` : order.details;
            const user = order.user.length > 50 ? `${order.user.substring(0, 47)}...` : order.user;

            return {
                label: order.id,
                description: `Details: ${details}\nUser: ${user}`,
                value: order.id,
                details: order.details,
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("claim_order")
            .setPlaceholder("Select an order to claim")
            .addOptions(options);

        const actionRow = {
            type: ComponentType.ActionRow,
            components: [selectMenu],
        };

        const embed = new EmbedBuilder()
            .setDescription("Please select an order to claim.")
            .setColor("#00FF00");

        await int.reply({
            embeds: [embed],
            components: [actionRow],
            ephemeral: true,
        });

        // Call the function to update command usage for the user
        await upsertWorkerInfo(int.user, "claim");
    });

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const componentId = interaction.customId;
    if (componentId === "claim_order") {
        const orderId = interaction.values[0];

        if (claimedOrders.has(orderId)) {
            await interaction.reply({ content: "This order has already been claimed.", ephemeral: true });
            return;
        }

        // Check if a claim lock exists for this order
        if (claimedOrderLocks.has(orderId) && claimedOrderLocks.get(orderId)) {
            await interaction.reply({ content: "Another user is currently claiming this order. Please try again later.", ephemeral: true });
            return;
        }

        // Set a claim lock for this order
        claimedOrderLocks.set(orderId, true);

        const order = await db.orders.findUnique({
            where: {
                id: orderId,
            },
            select: {
                id: true,
                user: true,
                details: true,
            },
        });

        if (!order) {
            // Release the claim lock
            claimedOrderLocks.delete(orderId);
            await interaction.reply({ content: "Invalid order selected.", ephemeral: true });
            return;
        }

        if (order.user === interaction.user.id && !permissions.developer.hasPermission(interaction.user)) {
            // Release the claim lock
            claimedOrderLocks.delete(orderId);
            await interaction.reply({ content: text.common.interactOwn, ephemeral: true });
            return;
        }

        // Update the claimed order and release the claim lock
        await db.orders.update({
            where: { id: orderId },
            data: { claimer: interaction.user.id, status: OrderStatus.Preparing },
        });

        claimedOrders.add(orderId);

        await interaction.reply({
            content: `${text.commands.claim.success.replace("{id}", order.id)}`,
            ephemeral: false,
        });
    }
});
