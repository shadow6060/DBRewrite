import { SlashCommandBuilder } from "@discordjs/builders";
import { db } from "../../../database/database";
import { getWorkerInfo } from "../../../database/workerInfo";
import { permissions } from "../../../providers/permissions";
import { CommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { text } from "../../../providers/config";
import { format } from "../../../utils/string";
import { Command } from "../../../structures/Command";
import { getWorkerInfos } from "../../../database/workerInfo";

async function refreshWorkerInfos() {
	// Refresh worker infos from the database
	await getWorkerInfos(true);
	// Wait for 1 second before retrieving the worker infos again
	await new Promise(resolve => setTimeout(resolve, 1000));
}

export const command = new Command("leaderboard", "hm.")
	.addPermission(permissions.developer)
	.setExecutor(async (int: CommandInteraction) => {
		// Refresh worker infos from the database
		await refreshWorkerInfos();

		// Create embed
		const embed = new EmbedBuilder()
			.setTitle("Delivery Leaderboard")
			.setColor("Aqua");

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

		// Add fields for each worker info, removing duplicates for the current user
		if (activeWorkerInfos.length > 0) {
			let addedUser = false;
			activeWorkerInfos.forEach((workerInfo, i) => {
				const isTopThree = i < 3;
				const emoji =
					i === 0
						? "🥇"
						: i === 1
							? "🥈"
							: i === 2
								? "🥉"
								: "";
				if (workerInfo.id === int.user.id) {
					// Add the user's worker info to the embed if it has not been added yet
					if (!addedUser && (workerInfo.deliveries > 0 || workerInfo.preparations > 0)) {
						embed.addFields({
							name: `${isTopThree ? emoji : ""} ${i + 1}. ${workerInfo.id}`,
							value: `Delivered: ${workerInfo.deliveries} | Preparations: ${workerInfo.preparations}`,
						});
						addedUser = true;
					}
				} else {
					embed.addFields({
						name: `${isTopThree ? emoji : ""} ${i + 1}. ${workerInfo.id}`,
						value: `Delivered: ${workerInfo.deliveries} | Preparations: ${workerInfo.preparations}`,
					});
				}
			});
		} else {
			// Display a message if there are no active worker infos
			embed.setDescription("No active workers found.");
		}

		// Reply with embed
		await int.reply({ embeds: [embed] });
	});

export { command as leaderboard };
