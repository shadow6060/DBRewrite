/* eslint-disable indent */
/* eslint-disable quotes */
import {OrderStatus} from "@prisma/client";
import {db} from "../../../database/database";
import {upsertWorkerInfo} from "../../../database/workerInfo";
import {constants} from "../../../providers/config";
import {permissions} from "../../../providers/permissions";
import {Command} from "../../../structures/Command";
import {randRange} from "../../../utils/utils";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    CollectedMessageInteraction,
    ComponentType,
    EmbedBuilder,
    StringSelectMenuBuilder
} from "discord.js";
import {IllegalStateError} from "../../../utils/error";

// Define the getClaimedOrders function without specifying OrderStatus
async function getClaimedOrders(userId: string) {
    return await db.orders.findMany({
        where: {
            claimer: userId,
            status: OrderStatus.Preparing,
        },
    });
}

export const command = new Command(
    "ebrew",
    "Brews your claimed order."
)
    .addSubCommand((subcommand) =>
        subcommand
            .setName("attach")
            .setDescription("Attach an image to your order.")
            .addAttachmentOption((option) =>
                option
                    .setName("attachment")
                    .setDescription("The image to attach to the order.")
                    .setRequired(true)
            )
    )
    .addSubCommand((subcommand) =>
        subcommand
            .setName("url")
            .setDescription("Attach an image to your order by URL.")
            .addStringOption((option) =>
                option
                    .setName("url")
                    .setDescription("The URL of the image to attach to the order.")
                    .setRequired(true)
            )
    )
    .addSubCommand((subcommand) =>
        subcommand
            .setName("claim")
            .setDescription("Claim an order.")
    )
    .addPermission(permissions.employee)
    .setExecutor(async (int: ChatInputCommandInteraction) => {
        // Check the subcommand
        const subcommand = int.options.getSubcommand(true);

        // temporary workaround, since client does not have ordersInProcess
        let client: Client<true> & {
            ordersInProcess?: { [userId: string]: { orderId: string } };
        } = int.client;

        if (subcommand === "claim") {
            // Get a list of claimed orders for the user using getClaimedOrders
            const claimedOrders = await getClaimedOrders(int.user.id);

            // Check if the user has claimed orders
            if (claimedOrders.length === 0) {
                await int.reply({ content: "You don't have any claimed orders to brew." });
                return;
            }

            // Build a select menu with claimed order options
            const orderOptions = claimedOrders.map(order => ({
                label: `Order ${order.id}`,
                value: order.id.toString(),
                description: `User: ${order.user.substring(0, 15)}...\nDetails: ${order.details.substring(0, 50)}...`,
                // Include user and details in the description, limiting the length
            }));

            const orderSelectMenu = new StringSelectMenuBuilder()
                .setCustomId("select_order_to_claim")
                .setPlaceholder("Select an order to brew")
                .addOptions(orderOptions);

            const actionRow = {
                type: ComponentType.ActionRow,
                components: [orderSelectMenu],
            };

            await int.reply({
                content: "Please select an order to brew:",
                components: [actionRow],
                ephemeral: true,
            });

            if (!int.channel) throw new IllegalStateError("Channel is not available.");
            // Create a collector to listen for the user's selection
            const filter: (i: CollectedMessageInteraction) => boolean = (i) => i.customId === "select_order_to_claim" && i.user.id === int.user.id;
            const collector = int.channel.createMessageComponentCollector({ filter, time: 15000 });
            int.channel.createMessageComponentCollector(

            )
            collector.on("collect", async (interaction: CollectedMessageInteraction) => {
                if (interaction instanceof ButtonInteraction) throw new IllegalStateError("help how did we get here?!?");
                const selectedOrderId = interaction.values[0];

                // Fetch the order details using the order ID
                const selectedOrder = await db.orders.findUnique({
                    where: {
                        id: selectedOrderId,
                    },
                });

                if (!selectedOrder) {
                    await interaction.update({ content: "Invalid order selected.", components: [] });
                    return;
                }

                // Check if the order status is not OrderStatus.Preparing
                if (selectedOrder.status !== OrderStatus.Preparing) {
                    await interaction.update({
                        content: `You cannot claim an order with status ${selectedOrder.status}.`,
                        components: [],
                    });
                    return;
                }

                // Store the selected order ID in a context variable for future use
                client.ordersInProcess = {
                    [int.user.id]: {
                        orderId: selectedOrderId,
                    },
                };

                await interaction.update({
                    content: `You selected Order ${selectedOrderId} to brew. Now, you can proceed to attach an image or provide a URL.`,
                    components: [],
                });
            });

            collector.on("end", async (collected) => {
                if (collected.size === 0) {
                    await int.followUp("You didn't select an order in time.");
                }
            });

        } else if ((subcommand === "attach" || subcommand === "url") && client.ordersInProcess?.[int.user.id]?.orderId) {
            // Fetch the order ID from the context variable
            const selectedOrderId = client.ordersInProcess[int.user.id].orderId;

            // Fetch the order details using the order ID
            const order = await db.orders.findUnique({
                where: {
                    id: selectedOrderId,
                },
            });

            if (!order) {
                await int.reply({ content: "Invalid order selected." });
                return;
            }

            // Check if the order status is OrderStatus.PendingDelivery or OrderStatus.Brewing
            if (order.status === OrderStatus.PendingDelivery || order.status === OrderStatus.Brewing) {
                await int.reply({ content: "You have Already Brewed this order. select an new one!" });
                return;
            }

            let imageUrl: string | undefined;

            if (subcommand === "attach") {
                const attachment = int.options.get("attachment", true)?.attachment;
                if (!attachment) {
                    await int.reply({ content: "Attachment is missing or not valid." });
                    return;
                }
                imageUrl = attachment.url;
            } else if (subcommand === "url") {
                const url = int.options.getString("url", true);
                imageUrl = url;
            }

            // Include order description in the confirmation message
            const confirmationDescription = `Order Details: ${order.details}`;

            const imagePreviewEmbed = new EmbedBuilder()
                .setTitle("Image Preview")
                .setImage(imageUrl!) // Set the image URL as the preview, TODO: Fix the non-null assertion
                .toJSON();

            const confirmSelectMenu = new StringSelectMenuBuilder()
                .setCustomId("confirm_brew")
                .setPlaceholder("Select an option")
                .addOptions([
                    {
                        label: "Yes",
                        description: "Proceed with brewing the order",
                        value: "yes",
                    },
                    {
                        label: "No",
                        description: "Cancel the brewing process",
                        value: "no",
                    },
                ]);

            const confirmActionRow = {
                type: ComponentType.ActionRow,
                components: [confirmSelectMenu],
            };

            await int.reply({
                content: `Do you want to proceed with brewing this order?\n${confirmationDescription}`,
                embeds: [imagePreviewEmbed],  // Include the image preview in the message
                components: [confirmActionRow],
                ephemeral: true,
            });

            if (!int.channel) throw new IllegalStateError("Channel is not available.");

            const confirmFilter: (i: CollectedMessageInteraction) => boolean = (i) => i.customId === "confirm_brew" && i.user.id === int.user.id;
            const confirmCollector = int.channel.createMessageComponentCollector({ filter: confirmFilter, time: 15000 });

            confirmCollector.on("collect", async (confirmInteraction) => {
                if (confirmInteraction.isStringSelectMenu()) {
                    const selectedValue = confirmInteraction.values[0];
                    if (selectedValue === "yes") {
                        await confirmInteraction.update({
                            content: "You chose to proceed with brewing the order.",
                            components: [],
                        });

                        const time = randRange(...constants.brewTimeRangeMs);
                        await db.orders.update({
                            where: {
                                id: order.id,
                            },
                            data: {
                                status: OrderStatus.Brewing,
                                image: imageUrl ?? "default.png",
                                timeout: new Date(Date.now() + time),
                            },
                        });
                        await upsertWorkerInfo(int.user);

                        await int.followUp({
                            content: "Brewing process started.",
                            files: imageUrl ? [{ attachment: imageUrl }] : undefined,
                        });
                    } else if (selectedValue === "no") {
                        await confirmInteraction.update({
                            content: "You chose to cancel the brewing process.",
                            components: [],
                        });
                    }
                }
            });

            confirmCollector.on("end", async (collected) => {
                if (collected.size === 0) {
                    await int.followUp("You didn't make a selection in time.");
                }
            });
        } else {
            await int.reply({ content: "You need to claim an order first before attaching an image or providing a URL." });
        }
    });
