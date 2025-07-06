/* eslint-disable @typescript-eslint/no-empty-function */
import type { Interaction, StringSelectMenuInteraction, TextChannel } from "discord.js";
import { ComponentType } from "discord.js";
import { createCategorySelectMenu } from "../../components/DrinkMenuComp";
import { activeMenus } from "../DrinkMenu/state"; // will define in command later
import { handleDrinkPages } from "../DrinkMenu/drinkPageHandler";

export async function handleCategorySelection(
	i: Interaction,
	categories: string[],
	userId: string
) {
	if (!i.isRepliable() || !i.channel) return;

	const categoryMenu = createCategorySelectMenu(categories);

	let categoryMessage;
	if (i.isButton() || i.isStringSelectMenu()) {
		categoryMessage = await i.update({
			content: "📋 Select a drink category:",
			components: [categoryMenu],
		});
	} else if (i.isCommand()) {
		categoryMessage = await i.reply({
			content: "📋 Select a drink category:",
			components: [categoryMenu],
		});
	} else return;

	activeMenus.set(userId, categoryMessage.id);

	const catInt = await categoryMessage.awaitMessageComponent({
		componentType: ComponentType.StringSelect,
		time: 15000,
		filter: (intComp: StringSelectMenuInteraction) => intComp.user.id === userId,
	}).catch(() => null);

	if (!catInt || !catInt.isStringSelectMenu()) {
		await categoryMessage.delete().catch(() => { });
		activeMenus.delete(userId);
		return;
	}

	await handleDrinkPages(catInt, catInt.values[0], categories, userId);
}
