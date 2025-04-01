/* eslint-disable linebreak-style */
import { Command } from "../../structures/Command";

export const command = new Command("ping", "Check the bot's latency.")
	.setDisabled(false) // Disable this command
	.setExecutor(async int => {
		// Check if the command is disabled
		if (command.disabled) {
			await int.reply("This command is currently disabled.");
			return;
		}

		const ping = int.client.ws.ping; // Get bot's WebSocket latency
		await int.reply(`🏓 Pong! Latency is **${ping}ms**.`);
	});
