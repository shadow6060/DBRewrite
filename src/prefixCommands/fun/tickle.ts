/* eslint-disable indent */
import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new PrefixCommand("tickle", "Give your friends a good tickle.")
    .addOption("user", o => o.setName("tickle").setDescription("Tickle your friends.").setRequired(true))
    .setCategory("fun")
    .setPrefixExecutor(async (message, args) => {
        const nekos = new Client();
        const yeeeee = await nekos.tickle();
        const tickled = message.mentions.users.first();
        const tcfe = text.commands.feedback.embed;
        await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Bam someone got tickled")
                    .setImage(yeeeee.url)
                    .setDescription(`${tickled} got tickled by ${message.author.tag}`)
                    .setFooter({ text: format(tcfe.footer, message.author.tag), iconURL: message.author.displayAvatarURL() }),
            ],
        });
    });
