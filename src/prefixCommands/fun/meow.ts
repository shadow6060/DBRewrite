/* eslint-disable linebreak-style */
import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new PrefixCommand("meow", "Cute kittens.")
	.setCategory("fun")
	.setPrefixExecutor(async (message, args) => {
		const nekos = new Client();
		const yeeeee = await nekos.meow();
		const tcfe = text.commands.feedback.embed;
		await message.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("You Summoned a kitten!")
					.setImage(yeeeee.url)
					.setDescription(`${message.author.tag} Has summoned a kitten!`)
					.setFooter({ text: format(tcfe.footer, message.author.tag), iconURL: message.author.displayAvatarURL() }),
			],
		});
	});
