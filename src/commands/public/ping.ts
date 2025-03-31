/* eslint-disable linebreak-style */
import { Command } from "../../structures/Command";

export const command = new Command("ping", "Check the bot's latency.")
	.setExecutor(async int => {
		const ping = int.client.ws.ping; // Get bot's WebSocket latency
		await int.reply(`🏓 Pong! Latency is **${ping}ms**.`);
	});
