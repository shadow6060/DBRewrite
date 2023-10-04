/* eslint-disable indent */
import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { getClaimedOrder } from "../../../database/orders";
import { text } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { CommandInteraction } from "discord.js";

export const command = new Command(
    "editstatus",
    "Edit the status of an order."
)
    .addPermission(permissions.moderator)
    .addOption("string", (option) =>
        option
            .setName("order_id")
            .setDescription("The ID of the order to edit.")
            .setRequired(true)
    )
    .addOption("string", (option) =>
        option
            .setName("status")
            .setDescription("The status to set.")
            .setRequired(true)
            .addChoices(
                { name: "Preparing", value: OrderStatus.Preparing },
                { name: "Unprepared", value: OrderStatus.Unprepared },
                { name: "PendingDelivery", value: OrderStatus.PendingDelivery },

                // Add other choices here if needed
            )
    )
    .setExecutor(async (int: CommandInteraction) => {
        const orderId = int.options.getString("order_id", true);
        const newStatus = int.options.getString("status", true);

        const order = await getClaimedOrder(orderId);
        if (!order) {
            await int.reply({ content: "Order not found for the specified ID." });
            return;
        }

        await db.orders.update({
            where: {
                id: order.id,
            },
            data: {
                status: newStatus,
            },
        });

        await int.reply({ content: `Order status for order (${orderId}) has been updated to ${newStatus}.` });
    });

module.exports = { command };
