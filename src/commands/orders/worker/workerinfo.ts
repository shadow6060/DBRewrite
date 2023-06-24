/* eslint-disable indent */
import { CommandInteraction, User } from "discord.js";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { PrismaClient, CafeStatus, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const command = new Command("workerinfo",
    "Tracks the number of orders an employee has delivered.")
    .addPermission(permissions.employee)
    .addOption("user", (o) =>
        o.setName("employee")
            .setDescription("The employee whose stats to check.")
            .setRequired(false)
    )
    .setExecutor(async (int: CommandInteraction) => {
        let employeeId = int.user.id; // assuming the employee's ID is the user's ID

        // If an employee is specified, use their ID instead
        const employeeOption = int.options.getUser("employee");
        if (employeeOption) {
            employeeId = employeeOption.id;
        }

        // Get the number of orders the employee has delivered
        const deliveredOrders = await prisma.orders.count({
            where: {
                deliverer: employeeId,
                status: OrderStatus.Delivered,
            },
        });

        // Get the user's username for the reply
        const username = employeeOption ? employeeOption.username : int.user.username;

        await int.reply(`${username} has delivered ${deliveredOrders} orders.`);
    });
