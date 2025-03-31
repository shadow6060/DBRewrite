import { PrefixCommand } from "../../structures/prefixCommand";
import type { Message } from "discord.js";

export const command = new PrefixCommand("tos", "Gives you a link to our TOS.")
	.setCategory("public")
	.setPrefixExecutor(async (message: Message, args: string[], options: Record<string, any>) => {
		await message.reply("https://drunk-bartender.org/Terms_of_Service");
	});
