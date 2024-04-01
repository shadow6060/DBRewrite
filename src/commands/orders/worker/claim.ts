/* eslint-disable indent */
import { Command } from "../../../structures/Command";
import { permissions } from "../../../providers/permissions";
import { OrderStatus, getClaimedOrder } from "../../../database/orders";
import { db } from "../../../database/database";
import { text } from "../../../providers/config";
import { client } from "../../../providers/client";
import { CommandInteraction, StringSelectMenuBuilder, ComponentType, EmbedBuilder } from "discord.js";
import { ExtendedCommand } from "../../../structures/extendedCommand";

const claimedOrderLocks = new Map<string, boolean>();
const claimedOrders = new Set<string>();

export const command = new ExtendedCommand(
    { name: "claim", description: "Claims an order.", local: true }
)
    .addPermission(permissions.employee)
    .setExecutor(async (int: CommandInteraction) => {
        const existingOrder = await getClaimedOrder(int.user);
        if (existingOrder) {
            await int.reply({ content: text.commands.claim.existing, ephemeral: true });
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

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const componentId = interaction.customId;
    if (componentId === "claim_order") {
        const orderId = interaction.values[0];

        if (claimedOrders.has(orderId)) {
            await interaction.reply({ content: "This order has already been claimed.", ephemeral: true });
            return;
        }

        if (claimedOrderLocks.has(orderId) && claimedOrderLocks.get(orderId)) {
            await interaction.reply({ content: "Another user is currently claiming this order. Please try again later.", ephemeral: true });
            return;
        }

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
            claimedOrderLocks.delete(orderId);
            await interaction.reply({ content: "Invalid order selected.", ephemeral: true });
            return;
        }

        if (order.user === interaction.user.id && !permissions.developer.hasPermission(interaction.user)) {
            claimedOrderLocks.delete(orderId);
            await interaction.reply({ content: text.common.interactOwn, ephemeral: true });
            return;
        }

        await db.orders.update({
            where: { id: orderId },
            data: { claimer: interaction.user.id, status: OrderStatus.Preparing },
        });

        claimedOrders.add(orderId);
        claimedOrderLocks.delete(orderId);

        try {
            await interaction.reply({
                content: `${text.commands.claim.success.replace("{id}", order.id)}`,
                ephemeral: false,
            });
        } catch (error) {
            console.error("Error replying to interaction:", error);
        }
    }
});
