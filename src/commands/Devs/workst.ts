/* eslint-disable indent */
import { WorkerInfo } from "@prisma/client";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { getWorkerInfo } from "../../database/workerInfo"; // Update with the correct path
import { CommandInteraction, EmbedBuilder } from "discord.js";

export const command = new Command("workst", "view a worker's stats by their id.")
    .addPermission(permissions.employee)
    .setExecutor(async (int: CommandInteraction) => {
        try {
            const userId = int.options.getString("user_id");

            if (!userId) {
                await int.reply({ content: "Please provide a user ID.", ephemeral: true });
                return;
            }

            const workerInfo = await getWorkerInfo(userId);

            if (!workerInfo) {
                await int.reply({ content: "Worker not found.", ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Worker Stats for ID: ${workerInfo.id}`)
                .addFields([
                    { name: "Preparations", value: workerInfo.preparations.toString(), inline: true },
                    { name: "Deliveries", value: workerInfo.deliveries.toString(), inline: true },
                    { name: "Claim Usage Count", value: workerInfo.claimUsageCount.toString(), inline: true },
                    { name: "Brew Usage Count", value: workerInfo.brewUsageCount.toString(), inline: true }
                ])
                .setTimestamp();

            await int.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in workerinfo command:", error);
            await int.reply({ content: "An error occurred while fetching worker information.", ephemeral: true });
        }
    });
