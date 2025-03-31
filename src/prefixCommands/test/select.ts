import { ActionRowBuilder, MessageActionRowComponentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { PrefixCommand } from "../../structures/prefixCommand";
import { permissions } from "../../providers/permissions";

export const command = new PrefixCommand("selecttest", "Test dropdown selection")
	.addPermission(permissions.admin)
	.setCategory("Admin") 
	.setPrefixExecutor(async (message) => {
		const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("test_dropdown")
				.setPlaceholder("Select an option")
				.addOptions([
					new StringSelectMenuOptionBuilder().setLabel("Option 1").setValue("option1"),
					new StringSelectMenuOptionBuilder().setLabel("Option 2").setValue("option2"),
					new StringSelectMenuOptionBuilder().setLabel("Option 3").setValue("option3"),
				])
		);

		await message.reply({ content: "Choose an option:", components: [row] });
	});
