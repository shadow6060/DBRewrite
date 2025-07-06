import {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ButtonBuilder,
	ButtonStyle
} from "discord.js";

// Category Select Menu
export function createCategorySelectMenu(categories: string[]) {
	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId("select_category")
			.setPlaceholder("Choose a category")
			.addOptions(
				categories.map(category => ({
					label: category,
					value: category,
				}))
			)
	);
}

// Drink Select Menu
export function createDrinkSelectMenu(drinks: { id: number; drinkName: string; price?: number }[]) {
	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId("select_drink")
			.setPlaceholder("Select a drink")
			.addOptions(
				drinks.map(drink => ({
					label: drink.drinkName,
					value: drink.id.toString(),
					description: drink.price ? `$${drink.price}` : undefined,
				}))
			)
	);
}

// Navigation Buttons
export function createNavigationButtons(currentPage: number, totalPages: number) {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId("prev_page")
			.setLabel("⬅️ Prev")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(currentPage === 0),
		new ButtonBuilder()
			.setCustomId("menu_back")
			.setLabel("🔙 Menu")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId("next_page")
			.setLabel("➡️ Next")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(currentPage >= totalPages - 1)
	);
}

// Confirmation Buttons
export function createConfirmationButtons(hasPrice: boolean) {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId("confirm_order")
			.setLabel("✅ Confirm")
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId("cancel_order")
			.setLabel("❌ Cancel")
			.setStyle(ButtonStyle.Danger),
		...(hasPrice
			? [new ButtonBuilder()
				.setCustomId("put_on_tab")
				.setLabel("💳 Put on Tab")
				.setStyle(ButtonStyle.Primary)]
			: [])
	);
}
  