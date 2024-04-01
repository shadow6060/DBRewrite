import { Command } from "../../structures/Command";
export const command = new Command("policy", "Gives you a link to our policy.")
	.setExecutor(async int => {
		int.reply("https://drunk-bartender.org/Policy");
	});