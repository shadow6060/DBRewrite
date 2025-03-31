import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new PrefixCommand("pat", "Give your friends a good Pat.")
	.addOption("user", o => o.setName("pat").setDescription("Pat your friends.").setRequired(true))
	.setCategory("fun")
	.setPrefixExecutor(async (message, args) => {
		const nekos = new Client();
		const yeeeee = await nekos.pat();
		const slapped = message.mentions.users.first();
		const tcfe = text.commands.feedback.embed;
		await message.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Bam someone got patted")
					.setImage(yeeeee.url)
					.setDescription(`${slapped} got patted by ${message.author.tag}`)
					.setFooter({ text: format(tcfe.footer, message.author.tag), iconURL: message.author.displayAvatarURL() }),
			],
		});
	});
