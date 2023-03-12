import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new Command("doggo", "Get cute doggos.")
	.addOption("user", o => o.setName("doggo").setDescription("Cutie doggos"))
	.setExecutor(async int => {
		const nekos = new Client();
		const yeeeee = await nekos.woof();
		const tcfe = text.commands.feedback.embed;
		await int.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Bam someone got doggoed")
					.setImage(yeeeee.url)
					.setFooter({ text: format(tcfe.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),

			],
		});
	}); 