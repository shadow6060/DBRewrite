import { MessageEmbed } from "discord.js";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new Command("goose", "See cute gooseeeeeeeeee")
	.addOption("user", o => o.setName("goose").setDescription("Honk at your friends.").setRequired(true))
	.setExecutor(async int => {
		const nekos = new Client();
		const yeeeee = await nekos.goose();
		const goose = int.options.getUser("goose", true);
		const tcfe = text.commands.feedback.embed;
		await int.reply({
			embeds: [
				new MessageEmbed()
					.setTitle("Hoooonk")
					.setImage(yeeeee.url)
					.setDescription(`${goose} got honked at by ${int.user.tag}`)
					.setFooter({ text: format(tcfe.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),

			],
		});
	}); 