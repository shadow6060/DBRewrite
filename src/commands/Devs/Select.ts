import { development } from "../../providers/env";
import { execSync } from "child_process";
import { format } from "../../utils/string";
import { transpile } from "typescript";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { client } from "../../providers/client";
import { channel } from "diagnostics_channel";
import { StringSelectMenuBuilder, EmbedBuilder } from "discord.js";
import { ExtendedCommand } from "../../structures/extendedCommand";

export const command = new ExtendedCommand(
	{ name: "select", description: "Select Menu Example.", local: true }
)
	.addPermission(permissions.developer) // add permission here
	.setExecutor(async (interaction) => {
		const select = new StringSelectMenuBuilder()
			.setCustomId("select")
			.setPlaceholder("Choose an option")
			.addOptions([
				{
					label: "Option 1",
					value: "option_1",
					description: "The first option",
					type: 3 // changed from "SELECT_MENU" to 3
				},
				{
					label: "Option 2",
					value: "option_2",
					description: "The second option",
					type: 3 // changed from "SELECT_MENU" to 3
				},
				{
					label: "Option 3",
					value: "option_3",
					description: "The third option",
					type: 3 // changed from "SELECT_MENU" to 3
				},
			]);

		const embed = new EmbedBuilder()
			.setColor("#0099ff")
			.setTitle("Select Menu Example")
			.setDescription("Please select an option:")
			.addFields(
				{ name: "Option 1", value: "The first option" },
				{ name: "Option 2", value: "The second option" },
				{ name: "Option 3", value: "The third option" }
			);
		await interaction.reply({
			embeds: [embed],
			components: [{
				type: 1, // changed from "ACTION_ROW" to 1
				components: [select]
			}],
		});
	});

module.exports = { command };
