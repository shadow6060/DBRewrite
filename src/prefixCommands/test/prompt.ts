import { Message, TextChannel, MessageCollector } from "discord.js";
import { PrefixCommand } from "../../structures/prefixCommand";

export const command = new PrefixCommand("prompt", "Test prompt-based input")
	.setCategory("test")
	.setPrefixExecutor(async (message: Message) => {
		// Ensure the message.channel is a TextChannel
		if (!(message.channel instanceof TextChannel)) {
			message.reply("This command can only be used in text channels.");
			return;
		}

		await message.reply("What is your favorite color?");

		// Create a filter to collect only the user's response
		const filter = (response: Message) => response.author.id === message.author.id;

		// Create the message collector
		const collector = message.channel.createMessageCollector({ filter, time: 30000 }) as MessageCollector;

		// Collect the response when the user sends a message
		collector.on("collect", async (response: Message) => {
			// Ensure message.channel is a TextChannel before calling .send()
			if (!(message.channel instanceof TextChannel)) {
				return; // If it's not a TextChannel, we just exit
			}

			// Send the response back to the channel
			await message.channel.send(`Your favorite color is: **${response.content}**`);
			collector.stop(); // Stop the collector once a response is received
		});

		// Handle the end of the collector (either by user response or timeout)
		collector.on("end", (collected, reason) => {
			// Convert collected Collection to an array if needed
			const collectedMessages = Array.from(collected.values());

			// Optionally process collected messages
			collectedMessages.forEach((message) => {
				console.log(`Collected message: ${message.content}`);
			});

			// Ensure message.channel is a TextChannel before calling .send()
			if (!(message.channel instanceof TextChannel)) {
				return; // If it's not a TextChannel, we just exit
			}

			if (reason === "time") {
				message.channel.send("You took too long to respond! ⏳");
			}
		});
	});
