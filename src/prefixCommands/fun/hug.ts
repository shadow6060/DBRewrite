import { EmbedBuilder, Message } from "discord.js";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import Client from "nekos.life";

export const command = new PrefixCommand("hug", "Give your friends a good hug.")
	.addOption("user", o => o.setName("hug").setDescription("Hug your friends.").setRequired(true))
	.setCategory("fun")
	.setPrefixExecutor(async (message: Message, args: string[]): Promise<void> => {
		const nekos = new Client();
		const hugGif = await nekos.hug();
		const hugged = message.mentions.users.first(); // Get the user mentioned for the hug
		const commandFeedback = text.commands.feedback.embed;

		if (!hugged) {
			// If no user is mentioned, send an error message
			message.reply("Please mention a user to hug!");
			return; // Return void
		}

		if (message.author.id === hugged.id) {
			// If the user is trying to hug themselves
			const selfHugGifUrl = "https://media1.tenor.com/m/mNZS9vIzMZYAAAAC/hug.gif"; // Self hug gif URL
			message.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Bam self hug")
						.setImage(selfHugGifUrl)
						.setDescription(`${message.author.tag} hugged themselves`)
						.setFooter({ text: format(commandFeedback.footer, message.author.tag), iconURL: message.author.displayAvatarURL() }),
				],
			});
			return; // Return void
		} else {
			// If the user is hugging someone else
			message.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Bam someone got hugged")
						.setImage(hugGif.url)
						.setDescription(`${hugged} got hugged by ${message.author.tag}`)
						.setFooter({ text: format(commandFeedback.footer, message.author.tag), iconURL: message.author.displayAvatarURL() }),
				],
			});
			return; // Return void
		}
	});
