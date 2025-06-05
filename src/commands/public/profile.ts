/* eslint-disable indent */
import { Command } from "../../structures/Command";
import { getUserInfo, requireUserProfile, formatDate } from "../../database/userInfo";
import { EmbedBuilder, MessageFlags } from "discord.js";

export const command = new Command("profile", "Shows your economy profile.")
    .setCategory("💲economy")
    .setExecutor(async (int) => {
        const userId = int.user.id;

        const info = await requireUserProfile(userId, int);
        if (!info) return;

        const embed = new EmbedBuilder()
            .setTitle("👤 Your Profile")
            .setColor(0x00b7ff)
            .setThumbnail(int.user.displayAvatarURL())
            .addFields(
                { name: "🪙 Balance", value: `$${info.balance.toLocaleString()}`, inline: true },
                //{ name: "🍩 Donuts", value: `${info.donuts ?? 0}`, inline: true },
                { name: "📅 Created", value: info.profileCreationDate ? formatDate(info.profileCreationDate) : "Unknown", inline: false }
            )
            .setFooter({ text: `ID: ${userId}` });

        await int.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    });
