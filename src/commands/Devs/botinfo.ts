/* eslint-disable indent */
import { CommandInteraction, EmbedBuilder } from "discord.js";
import os from "os";
import { client } from "../../providers/client";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { ExtendedCommand } from "../../structures/extendedCommand";
import { config } from "../../providers/config";

export const command = new ExtendedCommand({ name: "botinfo", description: "Displays information about the bot.", local: true })
    .addPermission(permissions.developer)
    .setExecutor(async (interaction: CommandInteraction) => {
        // Get the number of guilds (servers) the bot is in
        const guildsSize = client.guilds.cache.size.toString();

        // Get the bot's uptime
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;

        // Get the bot's memory usage
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        // Get the bot's CPU usage
        const cpuUsage = os.loadavg()[0].toFixed(2);

        // Create an embed to display the bot information
        const botInfoEmbed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("Bot Information")
            .addFields(
                { name: "Name", value: client.user?.username || "Unknown", inline: true },
                { name: "Version", value: "1.3.5", inline: true },
                { name: "Guilds", value: guildsSize, inline: true },
                { name: "Uptime", value: uptimeString, inline: true },
                { name: "Memory Usage", value: `${memoryUsage} MB`, inline: true },
            );

        // Send the embed to the user who used the command
        await interaction.reply({ embeds: [botInfoEmbed] });
    });
