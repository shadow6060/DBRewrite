/* eslint-disable linebreak-style */
import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new PrefixCommand("slap", "Give your friends a good slap.")
	.addOption("user", o => o.setName("slap").setDescription("Slap your friends.").setRequired(true))
	.setCategory("fun")
	.setPrefixExecutor(async (message, args) => {
		const nekos = new Client();
		const yeeeee = await nekos.slap();
		const slapped = message.mentions.users.first();
		const tcfe = text.commands.feedback.embed;
		await message.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Bam someone got slapped")
					.setImage(yeeeee.url)
					.setDescription(`${slapped} got slapped by ${message.author.tag}`)
					.setFooter({ text: format(tcfe.footer, message.author.tag), iconURL: message.author.displayAvatarURL() }),
			],
		});
	});
