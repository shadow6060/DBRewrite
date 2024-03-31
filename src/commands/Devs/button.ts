import {permissions} from "../../providers/permissions";
import {Command} from "../../structures/Command";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from "discord.js";

export const command = new Command("but", "hm.")
	.addPermission(permissions.developer) // add permission here
	.setExecutor(async int => {
		const button1 = new ButtonBuilder()
			.setLabel("Click me!")
			.setStyle(ButtonStyle.Link) //Button Styles: Primary, Secondary, Success, Danger, Link
			.setURL("https://drunk-bartender.org/Policy");

		const button2 = new ButtonBuilder()
			.setLabel("Click me too!")
			.setStyle(ButtonStyle.Primary)
			.setCustomId("2");

		const button3 = new ButtonBuilder()
			.setLabel("Click me as well!")
			.setStyle(ButtonStyle.Success)
			.setCustomId("3");

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(button1, button2, button3);

		await int.reply({
			fetchReply: true,
			content: "Here are three buttons:",
			components: [row]
		});
	});

module.exports = {command};
