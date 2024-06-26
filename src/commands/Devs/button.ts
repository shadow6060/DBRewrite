import { development } from "../../providers/env";
import { execSync } from "child_process";
import { format } from "../../utils/string";
import { transpile } from "typescript";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { client } from "../../providers/client";
import { channel } from "diagnostics_channel";
import { ButtonBuilder } from "discord.js";
import { ButtonStyle, ActionRowBuilder } from "discord.js";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand(
	{ name: "but", description: "hm.", local: true }
)
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

		const row = new ActionRowBuilder()
			.addComponents(button1, button2, button3,);

		await int.reply({
			content: "Here are three buttons:",
			components: [row],
		});
	});

module.exports = { command };
