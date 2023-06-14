/* eslint-disable indent */
import { StringSelectMenuBuilder, CommandInteraction, ComponentType, EmbedBuilder } from "discord.js"; //DON'T CHANGE THE IMPORTS!
import { Command } from "../../../structures/Command";
import { permissions } from "../../../providers/permissions";
import { OrderStatus, getClaimedOrder, } from "../../../database/orders";
import { db } from "../../../database/database";
import { text } from "../../../providers/config";
import { client } from "../../../providers/client";

export const command = new Command("claim", "Claims an order.")
    .addPermission(permissions.employee)
    .setExecutor(async (int: CommandInteraction) => {
        if (await getClaimedOrder(int.user)) {
            await int.reply({ content: text.commands.claim.existing, ephemeral: false });
            return;
        }

        const orders = await db.orders.findMany({
            where: {
                status: OrderStatus.Unprepared
            },
            select: {
                id: true,
                user: true,
                details: true // Include the 'details' property
            }
        });

        if (orders.length === 0) {
            await int.reply({ content: "There are no available orders to claim.", ephemeral: true });
            return;
        }

        const options = orders.map(order => {
            const details = order.details.length > 50 ? order.details.substring(0, 47) + "..." : order.details;
            const user = order.user.length > 50 ? order.user.substring(0, 47) + "..." : order.user;

            return {
                label: order.id,
                description: `Details: ${details}\nUser: ${user}`,
                value: order.id,
                details: order.details
            };
        });
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("claim_order")
            .setPlaceholder("Select an order to claim")
            .addOptions(options);

        const actionRow = {
            type: ComponentType.ActionRow,
            components: [selectMenu]
        };

        const embed = new EmbedBuilder()
            .setDescription("Please select an order to claim.")
            .setColor("#00FF00");

        await int.reply({
            embeds: [embed],
            components: [actionRow],
            ephemeral: true
        });
    });

// Interaction Create Event (for handling select menu interaction)
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const componentId = interaction.customId;
    if (componentId === "claim_order") {
        const orderId = interaction.values[0];

        const order = await db.orders.findUnique({
            where: {
                id: orderId
            },
            select: {
                id: true,
                user: true,
                details: true
            }
        });

        if (!order) {
            await interaction.reply({ content: "Invalid order selected.", ephemeral: true });
            return;
        }

        if (order.user === interaction.user.id && !permissions.developer.hasPermission(interaction.user)) {
            await interaction.reply({ content: text.common.interactOwn, ephemeral: true });
            return;
        }

        await db.orders.update({
            where: { id: orderId },
            data: { claimer: interaction.user.id, status: OrderStatus.Preparing }
        });

        await interaction.reply({
            content: `${text.commands.claim.success.replace("{id}", order.id)}`,
            ephemeral: false
        });
    }
});