import { Message } from "discord.js";
import { PrefixCommand } from "../../structures/prefixCommand";

export const command = new PrefixCommand("prompttest", "Test prompt-based input")
	.setCategory("test")
	.setPrefixExecutor(async (message) => {
		await message.reply("What is your favorite color?");

		const filter = (response: Message) => response.author.id === message.author.id;
		const collector = message.channel.createMessageCollector({ filter, time: 30000 });

		collector.on("collect", async (response) => {
			await message.channel.send(`Your favorite color is: **${response.content}**`);
			collector.stop();
		});

		collector.on("end", (collected, reason) => {
			if (reason === "time") {
				message.channel.send("You took too long to respond! ⏳");
			}
		});
	});
