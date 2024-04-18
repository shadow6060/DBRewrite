/* eslint-disable indent */
import {matchActiveOrder, OrderStatus} from "../../../database/orders";
import {permissions} from "../../../providers/permissions";
import {db} from "../../../database/database";
import {ExtendedCommand} from "../../../structures/extendedCommand";

export const command = new ExtendedCommand(
    { name: "editstatus", description: "Edit the status of an order.", local: true }
)
    .addPermission(permissions.admin)
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
                { name: "Cancelled", value: OrderStatus.Cancelled },
                { name: "Deleted", value: OrderStatus.Deleted },
                // Add other choices here if needed
            )
    )
	.setExecutor(async (int) => {
        const orderId = int.options.getString("order_id", true);
		const newStatus = int.options.getString("status", true) as OrderStatus;

		// assert newStatus is a valid OrderStatus to make sure this is type-safe
		if (!Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
			await int.reply({content: "Invalid status provided."});
			return;
		}

        const order = await matchActiveOrder(orderId);
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

        await int.reply({
            content: `Order status for order (${orderId}) has been updated to ${newStatus}.`,
        });
    });

module.exports = { command };
