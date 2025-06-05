import { EmbedBuilder } from "discord.js";

export function buildDrinkMenuEmbed(drinkCategories: Record<string, any[]>, page: number, maxPerPage: number) {
	const startIndex = page * maxPerPage;
	const categoriesToShow = Object.keys(drinkCategories).slice(startIndex, startIndex + maxPerPage);

	const embed = new EmbedBuilder()
		.setTitle("Drink Categories")
		.setDescription("Select a category:");

	for (const category of categoriesToShow) {
		const drinksInCategory = drinkCategories[category];
		embed.addFields({
			name: category,
			value: `Drinks: ${drinksInCategory.map(d => d.drinkName).join(", ")}`,
			inline: false,
		});
	}

	return embed;
}
