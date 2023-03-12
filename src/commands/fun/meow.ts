import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new Command("meow", "Cute kittens.")
	.setExecutor(async int => {
		const nekos = new Client();
		const yeeeee = await nekos.meow();
		const tcfe = text.commands.feedback.embed;
		await int.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("You Summoned a kitten!")
					.setImage(yeeeee.url)
					.setDescription(`${int.user.tag} Has summoned an kitten!`)
					.setFooter({ text: format(tcfe.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),

			],
		});
	}); 