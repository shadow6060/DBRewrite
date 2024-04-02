import { Command } from "../../structures/Command";
export const command = new Command("tos", "Gives you a link to our tos.")
	.setExecutor(async int => {
		int.reply("https://drunk-bartender.org/Terms_of_Service");
	});
