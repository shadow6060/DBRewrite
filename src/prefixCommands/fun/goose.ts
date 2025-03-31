/* eslint-disable linebreak-style */
import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new PrefixCommand("goose", "See cute gooseeeeeeeeee")
	.addOption("user", o => o.setName("goose").setDescription("Honk at your friends.").setRequired(true))
	.setCategory("fun")
	.setPrefixExecutor(async (message, args) => {
		const nekos = new Client();
		const yeeeee = await nekos.goose();
		const goose = message.mentions.users.first();
		const tcfe = text.commands.feedback.embed;
		await message.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Hoooonk")
					.setImage(yeeeee.url)
					.setDescription(`${goose} got honked at by ${message.author.tag}`)
					.setFooter({ text: format(tcfe.footer, message.author.tag), iconURL: message.author.displayAvatarURL() }),
			],
		});
	});
