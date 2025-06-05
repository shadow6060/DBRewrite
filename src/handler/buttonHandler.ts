import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	EmbedBuilder,
	ButtonInteraction,
} from "discord.js";
import { buildDrinkMenuEmbed } from "../utils/MysticUtils/helper";

export async function handleButtonInteraction(
	interaction: ButtonInteraction,
	drinkCategories: Record<string, any[]>,
	drinks: any[],
	page: number,
	maxPerPage: number
) {
	const buttonId = interaction.customId;

	if (buttonId.startsWith("category_")) {
		const category = buttonId.split("_")[1];
		const drinksInCategory = drinkCategories[category] || [];

		if (drinksInCategory.length === 0) {
			await interaction.reply({
				content: "No drinks found in this category.",
				ephemeral: true,
			});
			return;
		}

		const drinkOptions = drinksInCategory.map((drink) => ({
			label: drink.drinkName,
			value: drink.drinkName,
			description: `Price: $${drink.price?.toFixed(2) || "N/A"}`,
		}));

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(`select_${category}`)
			.setPlaceholder(`Select a ${category} drink`)
			.addOptions(drinkOptions);

		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

		await interaction.update({
			components: [row],
		});
		return;
	}

	if (buttonId === "previous") {
		page = Math.max(page - 1, 0);
	} else if (buttonId === "next") {
		page++;
	}

	const embed = buildDrinkMenuEmbed(drinkCategories, page, maxPerPage);

	await interaction.update({
		embeds: [embed],
	});
}
