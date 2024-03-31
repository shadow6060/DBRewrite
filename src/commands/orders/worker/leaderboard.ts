/* eslint-disable indent */
import {permissions} from "../../../providers/permissions";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, Message} from "discord.js";
import {Command} from "../../../structures/Command";
import {getWorkerInfos} from "../../../database/workerInfo";

const PAGE_SIZE = 5; // Number of workers per page

async function refreshWorkerInfos() {
	// Refresh worker infos from the database
	await getWorkerInfos();
	// Wait for 1 second before retrieving the worker infos again
	await new Promise((resolve) => setTimeout(resolve, 1000));
}

export const command = new Command("leaderboard", "hm.")
	.addPermission(permissions.developer)
	.setExecutor(async (int: CommandInteraction) => {
		// Refresh worker infos from the database
		await refreshWorkerInfos();

		// Get worker infos from database
		const workerInfos = await getWorkerInfos();

		// Filter out workers who have not delivered or prepared any orders
		const activeWorkerInfos = workerInfos.filter(
			(workerInfo) =>
				workerInfo.deliveries > 0 || workerInfo.preparations > 0
		);

		// Sort worker infos by delivered and prepared orders
		activeWorkerInfos.sort(
			(a, b) =>
				b.deliveries + b.preparations - (a.deliveries + a.preparations)
		);

		// Calculate the number of pages required
		const totalPages = Math.ceil(activeWorkerInfos.length / PAGE_SIZE);

		// Get the current page number from the command options (defaults to page 1)
		const currentPage = int.options.get("page", true).value as number ?? 1;

		// Calculate the start and end index for the workers on the current page
		const startIndex = (currentPage - 1) * PAGE_SIZE;
		const endIndex = Math.min(startIndex + PAGE_SIZE, activeWorkerInfos.length);

		// Create the embed
		const embed = new EmbedBuilder()
			.setTitle("Delivery Leaderboard")
			.setColor("Aqua");

		// Add fields for each worker info on the current page
		if (activeWorkerInfos.length > 0) {
			for (let i = startIndex; i < endIndex; i++) {
				const workerInfo = activeWorkerInfos[i];
				const isTopThree = i < 3;
				const emoji =
					i === 0
						? "🥇"
						: i === 1
							? "🥈"
							: i === 2
								? "🥉"
								: "";

				embed.addFields({
					name: `${isTopThree ? emoji : ""} ${i + 1}. ${workerInfo.id}`,
					value: `Delivered: ${workerInfo.deliveries} | Preparations: ${workerInfo.preparations}`,
				});
			}

			// Add page information to the embed
			embed.setFooter({text: `Page ${currentPage}/${totalPages}`});
		} else {
			// Display a message if there are no active worker infos
			embed.setDescription("No active workers found.");
		}

		// Send the initial embed
		const reply = await int.reply({embeds: [embed], fetchReply: true}) as Message;

		// Function to update the embed based on the current page
		const updateEmbed = async (pageNumber: number) => {
			// Calculate the start and end index for the workers on the updated page
			const startIndex = (pageNumber - 1) * PAGE_SIZE;
			const endIndex = Math.min(
				startIndex + PAGE_SIZE,
				activeWorkerInfos.length
			);

			// Clear the fields in the embed
			embed.setFields([]);

			// Add fields for each worker info on the updated page
			for (let i = startIndex; i < endIndex; i++) {
				const workerInfo = activeWorkerInfos[i];
				const isTopThree = i < 3;
				const emoji =
					i === 0
						? "🥇"
						: i === 1
							? "🥈"
							: i === 2
								? "🥉"
								: "";

				embed.addFields({
					name: `${isTopThree ? emoji : ""} ${i + 1}. ${workerInfo.id}`,
					value: `Delivered: ${workerInfo.deliveries} | Preparations: ${workerInfo.preparations}`,
				});
			}

			// Update the embed's page information
			embed.setFooter({text: `Page ${pageNumber}/${totalPages}`});

			// Update the message with the updated embed
			await reply.edit({embeds: [embed]});
		};

		// Add pagination buttons if there is more than one page
		if (totalPages > 1) {
			// Create the previous button
			const previousButton = new ButtonBuilder()
				.setCustomId("previous")
				.setLabel("Previous")
				.setStyle(ButtonStyle.Secondary);

			// Create the next button
			const nextButton = new ButtonBuilder()
				.setCustomId("next")
				.setLabel("Next")
				.setStyle(ButtonStyle.Secondary);

			// Create the action row with the pagination buttons
			const actionRow = new ActionRowBuilder()
				.addComponents(previousButton, nextButton);

			// Await the interaction with the pagination buttons
			const collector = reply.createMessageComponentCollector({
				filter: (interaction) =>
					interaction.user.id === int.user.id &&
					(interaction.customId === "previous" ||
						interaction.customId === "next"),
				time: 60000,
			});

			collector.on("collect", async (interaction) => {
				const {customId} = interaction;

				if (customId === "previous") {
					// Handle the previous button
					const newPage = Math.max(currentPage - 1, 1);
					await updateEmbed(newPage);
				} else if (customId === "next") {
					// Handle the next button
					const newPage = Math.min(currentPage + 1, totalPages);
					await updateEmbed(newPage);
				}

				// Update the message with the updated embed and action row
				await (interaction as any).update({embeds: [embed], components: [actionRow.toJSON() as any]});
			});

			collector.on("end", () => {
				// Remove the action row from the message after the collector ends
				reply.edit({components: []});
			});

			// Update the message with the initial embed and action row
			await reply.edit({embeds: [embed], components: [actionRow.toJSON() as any]});
		}
	});

export {command as leaderboard};