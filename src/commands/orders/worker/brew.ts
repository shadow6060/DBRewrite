/* eslint-disable indent */
/* eslint-disable quotes */
import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { getClaimedOrder } from "../../../database/orders";
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { constants } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { randRange } from "../../../utils/utils";
import { CollectedMessageInteraction, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { upsertWorkerStats } from "../../../database/workerstats"; // Import the workerstats functions
import { ExtendedCommand } from "../../../structures/extendedCommand";
import { IllegalStateError } from "../../../utils/error";
import { mainChannels, mainRoles } from "../../../providers/discord";
import { text } from "../../../providers/config";
import { format, format2, format3 } from "../../../utils/string";

export const command = new ExtendedCommand(
	{ name: "brew", description: "Brews your claimed order.", local: true }
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
	.setExecutor(async (int) => {
		const order = await getClaimedOrder(int.user);
		if (!order) {
			await int.reply({ content: "You don't have a claimed order." });
			return;
		}

		// Set last command to "brew" when brewing
		await upsertWorkerStats(int.user, { ordersBrewed: 1, lastCommand: "brew" });

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

			const confirmFilter = (i: CollectedMessageInteraction) => i.customId === "confirm_brew" && i.user.id === int.user.id;
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
						await int.followUp({
							content: "Brewing process started.",
							files: imageUrl ? [{ attachment: imageUrl }] : undefined,
						});

						await mainChannels.delivery.send(
							format2(
								text.commands.brew.ready2,
								mainRoles.dutyd.toString(),
								order.id
							)
						);
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

			const confirmFilter = (i: CollectedMessageInteraction) => i.customId === "confirm_brew_url" && i.user.id === int.user.id;
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

						// Update worker info
						await upsertWorkerInfo(int.user);
						await db.workerInfo.update({
							where: {
								id: int.user.id,
							},
							data: {
								preparations: { increment: 1 },
							},
						});
						await int.followUp({
							content: "Brewing process started.",
							files: imageUrl ? [{ attachment: imageUrl }] : undefined,
						});

						await mainChannels.delivery.send(
							format2(
								text.commands.brew.ready2,
								mainRoles.dutyd.toString(),
								order.id,
							)
						);

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
