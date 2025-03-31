import { PrefixCommand } from "../../structures/prefixCommand";
import type { Message } from "discord.js";

export const command = new PrefixCommand("policy", "Gives you a link to our policy.")
	.setCategory("public")
	.addAlias("pol")  // Add an alias
	.setPrefixExecutor(async (message: Message, args: string[], options: Record<string, any>) => {
		await message.reply("https://drunk-bartender.org/Policy");
	});
