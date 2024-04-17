// @ts-nocheck
/* eslint-disable quotes */
/* eslint-disable indent */
import {Command} from "../src/structures/Command";
import {permissions} from "../src/providers/permissions";
import {getClaimedOrder, OrderStatus} from "../src/database/orders";
import {db} from "../src/database/database";
import {text} from "../src/providers/config";
import {client} from "../src/providers/client";
import {CommandInteraction, ComponentType, EmbedBuilder, StringSelectMenuBuilder} from "discord.js";

const claimedOrderLocks = new Map<string, boolean>();  // Map to store claim locks for each order ID
const claimedOrders = new Set<string>();  // Set to store claimed order IDs

export const command = new Command("eclaim", "Claims an order.")
    .addPermission(permissions.employee)
    .setExecutor(async (int: CommandInteraction) => {
        const existingClaim = await getClaimedOrder(int.user);
        if (existingClaim) {
            console.log(`Existing claim found for ${int.user.id} on order ${existingClaim.id}`);
            await int.reply({ content: text.commands.claim.existing, ephemeral: true });
            return;
        }

        // Retrieve the selected values from interaction
        const orderIds = int.customId === "claim_order"
            ? int.values
            : int.message?.components
                .find((row) => row.components.some((component) => component.customId === "claim_order"))
                .components.find((component) => component.customId === "claim_order").value.split(",");

        const orders = await db.orders.findMany({
            where: {
                id: { in: orderIds },
                status: OrderStatus.Unprepared,
                claimer: null, // Check if the order is not already claimed
            },
            select: {
                id: true,
                user: true,
                details: true,
                status: true,
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
                description: `Details: ${details}\nUser: ${user}\nStatus: ${order.status}`,
                value: order.id,
                details: order.details,
            };
        });
        const minValues = Math.min(1, orders.length);
        const maxValues = Math.min(3, orders.length);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("claim_order")
            .setPlaceholder("Select orders to claim")
            .addOptions(options)
            .setMinValues(minValues)  // Set minimum selected values
            .setMaxValues(maxValues);  // Set maximum selected values

        const actionRow = {
            type: ComponentType.ActionRow,
            components: [selectMenu],
        };

        const embed = new EmbedBuilder()
            .setDescription("Please select orders to claim.")
            .setColor("#00FF00");

        try {
            const reply = await int.reply({
                embeds: [embed],
                components: [actionRow],
                ephemeral: true,
            });

            // Schedule a deletion of the reply after a certain time (e.g., 10 seconds)
            setTimeout(() => {
                reply.delete();
            }, 10000);
        } catch (error) {
            console.error("Error replying to interaction:", error);
        }
    });

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const componentId = interaction.customId;
    if (componentId === "claim_order") {
        // Retrieve the selected values from interaction
        const orderIds = interaction.values || [];
        const claimedOrderMessages = [];

        for (let i = 0; i < orderIds.length; i++) {
            const orderId = orderIds[i];
            try {
                // Check if a claim lock exists for this order
                if (claimedOrderLocks.has(orderId) && claimedOrderLocks.get(orderId)) {
                    claimedOrderMessages.push(`Another user is currently claiming Order ${orderId}. Please try again later.`);
                    continue;
                }

                // Set a claim lock for this order
                claimedOrderLocks.set(orderId, true);

                // Check if the order is still unclaimed in the database
                const unclaimedOrder = await db.orders.findFirst({
                    where: { id: orderId, status: OrderStatus.Unprepared, claimer: null },
                });

                if (!unclaimedOrder) {
                    console.log(`Order ${orderId} is already claimed.`);
                    claimedOrderMessages.push(`Order ${orderId} has already been claimed.`);
                    claimedOrderLocks.delete(orderId); // Release the claim lock for this order
                    continue;
                }

                // Update the claimed order and release the claim lock
                await db.orders.update({
                    where: { id: orderId },
                    data: { claimer: interaction.user.id, status: OrderStatus.Preparing },
                });

                claimedOrders.add(orderId);  // Store claimed order ID in the Set
                claimedOrderLocks.delete(orderId);

                claimedOrderMessages.push(`Order ${orderId} claimed successfully.`);
            } catch (error) {
                console.error(`Error processing Order ${orderId}:`, error);
                claimedOrderMessages.push(`Error processing Order ${orderId}`);
            } finally {
                claimedOrderLocks.delete(orderId);
            }
        }

        // Send a single reply summarizing the claimed orders
        try {
            const reply = await interaction.reply({
                content: `Claiming results:\n${claimedOrderMessages.join('\n')}`,
                ephemeral: false,
            });

            // Remove the first reply after a certain time (e.g., 5 seconds)
            setTimeout(() => {
                reply.delete();
            }, 5000);
        } catch (error) {
            console.error("Error replying to interaction:", error);
        }
    }
});
