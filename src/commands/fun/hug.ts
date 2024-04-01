import { MessageEmbed } from "discord.js";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new Command("hug", "Give your friends a good hug.")
	.addOption("user", o => o.setName("hug").setDescription("Hug your friends.").setRequired(true))
	.setExecutor(async int => {
		const nekos = new Client();
		const yeeeee = await nekos.hug();
		const slapped = int.options.getUser("hug", true);
		const tcfe = text.commands.feedback.embed;
		await int.reply({
			embeds: [
				new MessageEmbed()
					.setTitle("Bam someone got hugged")
					.setImage(yeeeee.url)
					.setDescription(`${slapped} got hugged by ${int.user.tag}`)
					.setFooter({ text: format(tcfe.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),

			],
		});
	});
