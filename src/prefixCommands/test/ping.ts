import { PrefixCommand } from "../../structures/prefixCommand";
import { Message } from "discord.js";
import { permissions } from "../../providers/permissions";

export const command = new PrefixCommand("ping", "Replies with Pong!")
	.addPermission(permissions.admin) // Require admin permission
	.addAlias("p")  // Add an alias
	.setCategory("test")
	.setPrefixExecutor(async (message: Message, args: string[]) => {
		await message.reply("🏓 Pong! 😭");
	});

 