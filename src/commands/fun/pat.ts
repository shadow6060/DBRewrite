import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new Command("pat", "Give your friends a good Pat.")
	.addOption("user", o => o.setName("pat").setDescription("Pat your friends.").setRequired(true))
	.setExecutor(async int => {
		const nekos = new Client();
		const yeeeee = await nekos.pat();
		const slapped = int.options.getUser("pat", true);
		const tcfe = text.commands.feedback.embed;
		await int.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Bam someone got patted")
					.setImage(yeeeee.url)
					.setDescription(`${slapped} got patted by ${int.user.tag}`)
					.setFooter({ text: format(tcfe.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),

			],
		});
	});
