import { EmbedBuilder } from "discord.js";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new Command("hug", "Give your friends a good hug.")
	.addOption("user", o => o.setName("hug").setDescription("Hug your friends.").setRequired(true))
	.setCategory("🎉fun")
	.setExecutor(async int => {
		await int.deferReply();  // Defer the reply to give more time for processing

		const nekos = new Client();
		const hugGif = await nekos.hug();
		const hugged = int.options.getUser("hug", true);
		const commandFeedback = text.commands.feedback.embed;

		if (int.user.id === hugged.id) {
			// Replace this URL with the direct link to your Imgur-hosted self-hug GIF
			const selfHugGifUrl = "https://media1.tenor.com/m/mNZS9vIzMZYAAAAC/hug.gif";

			await int.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Bam self hug")
						.setImage(selfHugGifUrl)
						.setDescription(`${int.user.tag} hugged themselves`)
						.setFooter({ text: format(commandFeedback.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),
				],
			});
		} else {
			await int.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Bam someone got hugged")
						.setImage(hugGif.url)
						.setDescription(`${hugged} got hugged by ${int.user.tag}`)
						.setFooter({ text: format(commandFeedback.footer, int.user.tag), iconURL: int.user.displayAvatarURL() }),
				],
			});
		}
	});
