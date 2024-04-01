/* eslint-disable indent */
/* eslint-disable quotes */
import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { generateOrderId, getClaimedOrder, hasActiveOrder, matchActiveOrder } from "../../../database/orders";
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { client } from "../../../providers/client";
import { config, constants, text } from "../../../providers/config";
import { mainGuild } from "../../../providers/discord";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { format } from "../../../utils/string";
import { randRange } from "../../../utils/utils";
import { StringSelectMenuBuilder, CommandInteraction, ComponentType, EmbedBuilder } from "discord.js";
import { upsertWorkerStats, handleBrew, handleDeliver } from "../../../database/workerstats"; // Import the workerstats functions

export const command = new Command(
    "brew",
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
    .addPermission(permissions.employee)
    .setExecutor(async (int: CommandInteraction) => {
        const order = await getClaimedOrder(int.user);
        if (!order) {
            await int.reply({ content: "You don't have a claimed order." });
            return;
        }

        // Set last command to "brew" when brewing
        await upsertWorkerStats(int.user, { lastCommand: "brew" });

        const subcommand = int.options.getSubcommand(true);
        let imageUrl: string | undefined;

        if (subcommand === "attach") {
            const attachment = int.options.get("attachment", true)?.attachment;
            if (!attachment) {
                await int.reply({ content: "Attachment is missing or not valid." });
                return;
            }
            imageUrl = attachment.url;

            // Create an embed with the image preview
            const imagePreviewEmbed = new EmbedBuilder()
                .setTitle("Image Preview")
                .setImage(imageUrl) // Set the image URL as the preview
                .toJSON();

            const confirmationDescription = `Order Details: ${order.details}`;

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
                ])
                .toJSON();

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

            const confirmFilter = (i) => i.customId === "confirm_brew" && i.user.id === int.user.id;
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

                        // Update worker stats when brewing an order
                        await handleBrew(int.user);
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

        } else if (subcommand === "url") {
            const url = int.options.getString("url", true);
            imageUrl = url;

            // Create an embed with the image preview
            const imagePreviewEmbed = new EmbedBuilder()
                .setTitle("Image Preview")
                .setImage(imageUrl) // Set the image URL as the preview
                .toJSON();

            const confirmationDescription = `Order Details: ${order.details}`;

            const confirmSelectMenu = new StringSelectMenuBuilder()
                .setCustomId("confirm_brew_url")
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
                ])
                .toJSON();

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

            const confirmFilter = (i) => i.customId === "confirm_brew_url" && i.user.id === int.user.id;
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

                        // Update worker stats when brewing an order
                        await handleBrew(int.user);
                        await upsertWorkerStats(int.user, { ordersBrewed: 1 }); // Increment the ordersBrewed count
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
        }
    });

// ... (existing code)
