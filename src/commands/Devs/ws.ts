/* eslint-disable quotes */
/* eslint-disable indent */
import { CommandInteraction, EmbedBuilder, UserResolvable } from "discord.js";
import { db } from "../../database/database";
import { getWorkerStats } from "../../database/workerstats";
import { resolveUserId } from "../../utils/id";
import { Command } from "../../structures/Command";
import { permissions } from "../../providers/permissions";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand(
    { name: "ws", description: "View worker statistics.", local: true }
)

    .addPermission(permissions.admin)
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to view statistics for.")
            .setRequired(false)
    )
    .setExecutor(async (int: CommandInteraction) => {
        const targetUser = int.options.getUser("user", false);

        let userId: string;
        if (targetUser) {
            userId = resolveUserId(targetUser);
        } else {
            userId = int.user.id;
        }

        const workerStats = await getWorkerStats(userId);

        const embed = new EmbedBuilder()
            .setTitle(`${targetUser ? targetUser.tag : int.user.username}'s Worker Statistics`)
            .addFields([
                { name: "Orders Brewed", value: workerStats.ordersBrewed.toString(), inline: true },
                { name: "Orders Delivered", value: workerStats.ordersDelivered.toString(), inline: true },
                { name: "Last Used", value: workerStats.lastUsed.toLocaleString(), inline: true },
                { name: "Last Command", value: workerStats.lastCommand || "None", inline: true },
            ])
            .toJSON();

        await int.reply({ embeds: [embed] });
    });