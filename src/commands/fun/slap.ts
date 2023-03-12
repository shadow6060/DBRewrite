import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new Command("slap", "Give your friends a good slap.")
	.addOption("user", o => o.setName("slap").setDescription("Slap your friends.").setRequired(true))
	.setExecutor(async int => {
		const nekos = new Client();
		const yeeeee = await nekos.slap();
		const slapped = int.options.getUser("slap", true);
		const tcfe = text.commands.feedback.embed;
		await int.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Bam someone got slapped")
					.setImage(yeeeee.url)
					.setDescription(`${slapped} got slapped by ${int.user.tag}`)
					.setFooter({ text: format(tcfe.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),

			],
		});
	}); 
