import { OrderStatus } from "@prisma/client";
import { db } from "../../../database/database";
import { getClaimedOrder } from "../../../database/orders";
import { upsertWorkerInfo } from "../../../database/workerInfo";
import { constants } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { randRange } from "../../../utils/utils";
import { CollectedMessageInteraction, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { upsertWorkerStats } from "../../../database/workerstats";
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

		const createConfirmationMessage = async (customId: string, imageUrl: string) => {
			const confirmationDescription = `Order Details: ${order.details}`;

			const confirmSelectMenu = new StringSelectMenuBuilder()
				.setCustomId(customId)
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
				embeds: [
					new EmbedBuilder()
						.setTitle("Image Preview")
						.setImage(imageUrl)
						.toJSON()
				],
				components: [confirmActionRow],
				ephemeral: true,
			});

			if (!int.channel) throw new IllegalStateError("Channel is not available.");

			const confirmFilter = (i: CollectedMessageInteraction) => i.customId === customId && i.user.id === int.user.id;
			const confirmCollector = int.channel.createMessageComponentCollector({ filter: confirmFilter, time: 15000 });

			confirmCollector.on("collect", async (confirmInteraction) => {
				if (confirmInteraction.isStringSelectMenu()) {
					const selectedValue = confirmInteraction.values[0];
					if (selectedValue === "yes") {
						await confirmInteraction.update({
							content: "You chose to proceed with brewing the order.",
							components: [],
						});

						setTimeout(async () => {
							await confirmInteraction.deleteReply();

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

							// Simulate brewing process delay
							setTimeout(async () => {
								// Update order status to PendingDelivery after brewing time has passed
								await db.orders.update({
									where: {
										id: order.id,
									},
									data: {
										status: OrderStatus.PendingDelivery,
										timeout: null, // Clear the timeout
									},
								});

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
									content: "Brewing process completed. The order is now pending delivery.",
									files: imageUrl ? [{ attachment: imageUrl }] : undefined,
								});

								await mainChannels.delivery.send(
									format2(
										text.commands.brew.ready2,
										mainRoles.dutyd.toString(),
										order.id
									)
								);
							}, time);
						}, 5000);

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
						ephemeral: true
					});

					// Ensure the components are cleared to exit the select menu
					await int.editReply({
						content: `Do you want to proceed with brewing this order?\n${confirmationDescription}`,
						components: [],
						embeds: [
							new EmbedBuilder()
								.setTitle("Image Preview")
								.setImage(imageUrl)
								.toJSON()
						],
					});

					setTimeout(async () => {
						await int.deleteReply();
					}, 5000);
				}
			});
		};

		if (subcommand === "attach") {
			const attachment = int.options.get("attachment", true)?.attachment;
			if (!attachment) {
				await int.reply({ content: "Attachment is missing or not valid." });
				return;
			}
			imageUrl = attachment.url;
			//console.log(`Brewing process started for order ${order.id} at ${new Date().toISOString()}`);

			await createConfirmationMessage("confirm_brew_attach", imageUrl);
		} else if (subcommand === "url") {
			const url = int.options.getString("url", true);
			imageUrl = url;
			//console.log(`Brewing process started for order ${order.id} at ${new Date().toISOString()}`);

			await createConfirmationMessage("confirm_brew_url", imageUrl);
		}
	});
