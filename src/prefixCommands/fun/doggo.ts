/* eslint-disable linebreak-style */
import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new PrefixCommand("doggo", "Get cute doggos.")
	.setCategory("fun")
	.setPrefixExecutor(async (message, args) => {
		const nekos = new Client();
		const yeeeee = await nekos.woof();
		const tcfe = text.commands.feedback.embed;

		await message.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Bam someone got doggoed")
					.setImage(yeeeee.url)
					.setFooter({ text: format(tcfe.footer, message.author.tag), iconURL: message.author.displayAvatarURL() }),
			],
		});
	});
