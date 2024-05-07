/* eslint-disable indent */
/* eslint-disable quotes */
import { Guild, ChannelType, EmbedBuilder } from "discord.js";
import { client } from "../providers/client";

client.on("guildCreate", async (guild: Guild) => {
    console.log(`Bot joined a new guild. Current guild count: ${client.guilds.cache.size}`);

    const channel = guild.systemChannel;
    if (channel && channel.type === ChannelType.GuildText) {
        const embed = new EmbedBuilder()
            .setTitle("Thank you for inviting me!")
            .setDescription("We are also looking for employees if you are interested in joining us!\nIf you want, you can join our support server!\n[***Our Server!***](https://discord.gg/sNbK4rRHYt)\nWe are online 24/7")
            .setColor("Random")
            .setFooter({ text: "Drunk Bartender Official", iconURL: client.user?.displayAvatarURL() })
            .setTimestamp()
            .toJSON();

        channel.send({ embeds: [embed] });
    }
});

client.on("guildDelete", async (guild: Guild) => {
    console.log(`Bot removed from a guild. Current guild count: ${client.guilds.cache.size}`);
});
