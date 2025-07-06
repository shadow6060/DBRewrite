/* eslint-disable no-mixed-spaces-and-tabs */
import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { getClaimedOrder } from "../../../database/orders";
import { upsertWorkerInfo } from "../../../database/workerinfo";
import { constants } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { randRange } from "../../../utils/utils";
import {
	CollectedMessageInteraction,
	ComponentType,
	EmbedBuilder,
	MessageFlags,
	StringSelectMenuBuilder,
	TextChannel,
} from "discord.js";
import { ExtendedCommand } from "../../../structures/extendedCommand";
import { IllegalStateError } from "../../../utils/error";
import { mainChannels, mainRoles } from "../../../providers/discord";
import { text } from "../../../providers/config";
import { format2 } from "../../../utils/string";

export const command = new ExtendedCommand(
	{ name: "brew", description: "Brews your claimed order.", local: true }
) 
	.addSubCommand((subcommand) =>
		subcommand
			.setName("attach")
			.setDescription("Attach an image to your order.")
			.addAttachmentOption((option) =>
				option.setName("attachment").setDescription("The image to attach to the order.").setRequired(true)
			)
	)
	.addSubCommand((subcommand) =>
		subcommand
			.setName("url")
			.setDescription("Attach an image to your order by URL.")
			.addStringOption((option) =>
				option.setName("url").setDescription("The URL of the image to attach to the order.").setRequired(true)
			)
	)
	.addPermission(permissions.employee)
	.setCategory("👊manual")
	.setExecutor(async (int) => {
		const order = await getClaimedOrder(int.user);
		if (!order) {
			await int.reply({ content: "You don't have a claimed order." });
			return;
		}

		const subcommand = int.options.getSubcommand(true);
		let imageUrl: string | undefined;

		// Function to create the confirmation message
		const createConfirmationMessage = async (customId: string, imageUrl: string) => {
			const confirmationDescription = `Order Details: ${order.details}`;

			const confirmSelectMenu = new StringSelectMenuBuilder()
				.setCustomId(customId)
				.setPlaceholder("Select an option")
				.addOptions([
					{ label: "Yes", description: "Proceed with brewing the order", value: "yes" },
					{ label: "No", description: "Cancel the brewing process", value: "no" },
				]);

			const confirmActionRow = {
				type: ComponentType.ActionRow,
				components: [confirmSelectMenu],
			};

			await int.reply({
				content: `Do you want to proceed with brewing this order?\n${confirmationDescription}`,
				embeds: [new EmbedBuilder().setTitle("Image Preview").setImage(imageUrl).toJSON()],
				components: [confirmActionRow],
				flags: MessageFlags.Ephemeral,
			});

			if (!int.channel) throw new IllegalStateError("Channel is not available.");

			const confirmCollector = int.channel.createMessageComponentCollector({
				filter: (i) => i.customId === customId && i.user.id === int.user.id,
				time: 15000,
			});

			confirmCollector.on("collect", async (confirmInteraction) => {
				if (confirmInteraction.isStringSelectMenu()) {
					const selectedValue = confirmInteraction.values[0];
					if (selectedValue === "yes") {
						await confirmInteraction.update({
							content: "You chose to proceed with brewing the order.",
							components: [],
						});

						const time = randRange(...constants.brewTimeRangeMs);

						// Handling the image URL properly
						let finalImageUrl: string;

						// Validate and assign the image URL
						if (imageUrl && imageUrl.startsWith("http")) {
							finalImageUrl = imageUrl; // Use provided URL if it's a valid one
						} else if (imageUrl) {
							finalImageUrl = imageUrl; // Handle non-URL images as they are (fallback)
						} else {
							finalImageUrl = "default.png"; // Use default image if no image is provided
						}

						await db.orders.update({
							where: { id: order.id },
							data: {
								status: OrderStatus.Brewing,
								imageUrl: imageUrl ?? "default.png", // Store the image URL directly
								timeout: new Date(Date.now() + time),
							},
							 });

						// Set a timeout to update the order status later
						setTimeout(async () => {
							await db.orders.update({
								where: { id: order.id },
								data: { status: OrderStatus.PendingDelivery, timeout: null },
							});

							await upsertWorkerInfo(int.user);
							await db.workerInfo.update({
								where: { id: int.user.id },
								data: { preparations: { increment: 1 } },
							});

							await int.followUp({
								content: "Brewing process completed. The order is now pending delivery.",
								files: finalImageUrl ? [{ attachment: finalImageUrl }] : undefined,
							});

							// Notify the delivery channel
							const deliveryChannel = mainChannels.delivery as TextChannel;
							await deliveryChannel.send(
								format2(text.commands.brew.ready2, mainRoles.dutyd.toString(), order.id)
							);
						}, time);
					} else if (selectedValue === "no") {
						await confirmInteraction.update({
							content: "You chose to cancel the brewing process.",
							components: [],
						});

						setTimeout(async () => {
							await confirmInteraction.deleteReply();
						}, 5000);
					}
				}
			});

			confirmCollector.on("end", async (collected) => {
				if (collected.size === 0) {
					await int.followUp({
						content: "You didn't make a selection in time. The brewing process has been canceled.",
					});
				}
			});
		};

		// Handle the subcommands for attaching image or URL
		if (subcommand === "attach") {
			imageUrl = int.options.getAttachment("attachment", true).url;
			await createConfirmationMessage("brewing-confirm", imageUrl);
		} else if (subcommand === "url") {
			imageUrl = int.options.getString("url", true);
			await createConfirmationMessage("brewing-confirm", imageUrl);
		}
	});
