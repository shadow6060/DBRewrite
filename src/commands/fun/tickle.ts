import { MessageEmbed } from "discord.js";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new Command("tickle", "Give your friends a good tickle.")
    .addOption("user", o => o.setName("tickle").setDescription("Tickle your friends.").setRequired(true))
    .setExecutor(async int => {
        const nekos = new Client();
        const yeeeee = await nekos.tickle();
        const tickled = int.options.getUser("tickle", true);
        const tcfe = text.commands.feedback.embed;
        await int.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle("Bam someone got tickled")
                    .setImage(yeeeee.url)
                    .setDescription(`${tickled} got tickled by ${int.user.tag}`)
                    .setFooter({ text: format(tcfe.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),

            ],
        });
    });