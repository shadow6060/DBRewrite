import type {
	StringSelectMenuInteraction} from "discord.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from "discord.js";

export async function handleSelectInteraction(
	interaction: StringSelectMenuInteraction,
	drinks: any[],
	drinkCategories: Record<string, any[]>
) {
	const selectedValue = interaction.values[0];
	const selectedDrink = drinks.find((d) => d.drinkName === selectedValue);

	if (!selectedDrink) {
		await interaction.reply({
			content: "Sorry, I couldn't find that drink.",
			ephemeral: true,
		});
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle(`You selected: ${selectedDrink.drinkName}`)
		.setDescription(`Price: $${selectedDrink.price?.toFixed(2) || "N/A"}`)
		.setImage(selectedDrink.image || null)
		.setColor("Random");

	const confirmButton = new ButtonBuilder()
		.setCustomId(`confirm_${selectedDrink.drinkName}`)
		.setLabel("Confirm Purchase")
		.setStyle(ButtonStyle.Success);

	const cancelButton = new ButtonBuilder()
		.setCustomId(`cancel_${selectedDrink.drinkName}`)
		.setLabel("Cancel")
		.setStyle(ButtonStyle.Danger);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

	await interaction.update({
		embeds: [embed],
		components: [row],
	});
}
