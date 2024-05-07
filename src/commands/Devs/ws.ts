/* eslint-disable indent */
import { ColorResolvable, CommandInteraction, EmbedBuilder } from "discord.js";
import { getWorkerStats, getWorkerStatsList, upsertWorkerStats } from "../../database/workerstats";
import { resolveUserId } from "../../utils/id";
import { permissions } from "../../providers/permissions";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand({
    name: "ws",
    description: "Manage worker statistics.",
    local: true
})
    .addPermission(permissions.admin)
    .addSubCommand(subcommand =>
        subcommand
            .setName("stats")
            .setDescription("View statistics for a user.")
            .addUserOption(option =>
                option
                    .setName("user")
                    .setDescription("The user to view statistics for.")
                    .setRequired(false)
            )
    )
    .addSubCommand(subcommand =>
        subcommand
            .setName("list")
            .setDescription("List users with worker statistics.")
    )
    .setExecutor(async (int: CommandInteraction) => {
        const subcommand = (int.options as any).getSubcommand(true);

        // Update lastUsed timestamp
        const userId = resolveUserId(int.user);
        await upsertWorkerStats(userId, { lastUsed: new Date() });

        if (subcommand === "stats") {
            const targetUser = int.options.getUser("user", false);

            let userId: string;
            let username: string;
            if (targetUser) {
                userId = resolveUserId(targetUser);
                username = targetUser.username;
            } else {
                userId = int.user.id;
                username = int.user.username;
            }

            const workerStats = await getWorkerStats(userId);
            if (!workerStats) {
                await int.reply({ content: "No worker statistics found for this user.", ephemeral: true });
                return;
            }

            // Calculate days since last used
            const lastUsed = new Date(workerStats.lastUsed);
            const now = new Date();
            const daysSinceLastUsed = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 3600 * 24));

            // Determine activity status and color
            let activityStatus: string;
            let activityColor: ColorResolvable;
            if (daysSinceLastUsed > 5) {
                activityStatus = "Inactive";
                activityColor = "Red"; // Red color 
            } else {
                activityStatus = "Active";
                activityColor = "Green"; // Green color
            }

            const embed = new EmbedBuilder()
                .setTitle(`${username}'s Worker Statistics`)
                .addFields([
                    { name: "Orders Brewed", value: workerStats.ordersBrewed.toString(), inline: true },
                    { name: "Orders Delivered", value: workerStats.ordersDelivered.toString(), inline: true },
                    { name: "Last Used", value: lastUsed.toLocaleString(), inline: true },
                    { name: "Days Since Last Used", value: `${daysSinceLastUsed} days`, inline: true },
                    { name: "Last Command", value: workerStats.lastCommand || "None", inline: true },
                    { name: "Activity Status", value: `**${activityStatus}**`, inline: true }, // Add activity status field with bold text
                ])
                .setColor(activityColor) // Set color of the embed
                .toJSON();

            await int.reply({ embeds: [embed] });
        } else if (subcommand === "list") {
            const workerStatsList = await getWorkerStatsList();
            if (workerStatsList.length === 0) {
                await int.reply({ content: "No users found with worker statistics.", ephemeral: true });
                return;
            }

            const userList = workerStatsList.map(stats => `<@${stats.id}> ID: ${stats.id}`).join("\n");
            const embed = new EmbedBuilder()
                .setTitle("Users with Worker Statistics")
                .setDescription(userList)
                .toJSON();

            await int.reply({ embeds: [embed] });
        } else {
            await int.reply({ content: "Invalid sub-command.", ephemeral: true });
        }
    });