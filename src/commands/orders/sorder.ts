/* eslint-disable indent */
import { db } from "../../database/database";
import { generateOrderId, hasActiveOrder } from "../../database/orders";
import { text } from "../../providers/config";
import { mainChannels, mainRoles } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("sorder", "Orders a drink.")
    .addOption("string", (o) =>
        o.setName("drink").setDescription("The drink to order.").setRequired(true),
    )
    .addOption("user", (o) =>
        o.setName("user").setDescription("Optional: Order for someone else."),
    )
    .setExecutor(async (int) => {
        if (await hasActiveOrder(int.user)) {
            await int.reply(text.commands.order.exists);
            return;
        }

        const drink = int.options.getString("drink", true);
        const orderFor = int.options.getUser("user");

        // Check the length of the drink description
        const maxDescriptionLength = 100; // Adjust this value as needed
        if (drink.length > maxDescriptionLength) {
            await int.reply(
                `Your order details are too long. Please limit them to ${maxDescriptionLength} characters.`,
            );
            return;
        }

        const order = await db.orders.create({
            data: {
                id: await generateOrderId(),
                user: orderFor ? orderFor.id : int.user.id, // Use provided user ID if available, else use the author's ID
                details: drink,
                channel: int.channelId,
                guild: int.guildId,
            },
        });

        await int.reply(
            format(text.commands.order.success, { id: order.id, details: drink }),
        );

        if (int.member.nickname?.toLowerCase() === "bart") {
            await int.followUp("I will end you");
        }

        await mainChannels.brewery.send(
            format(text.commands.order.created, {
                details: drink,
                duty: mainRoles.duty.toString(),
                id: order.id,
                tag: int.user.tag,
            }),
        );
    });
