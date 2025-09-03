/* eslint-disable @typescript-eslint/no-empty-function */
import type { Interaction, StringSelectMenuInteraction, TextChannel } from "discord.js";
import { ComponentType } from "discord.js";
import { createCategorySelectMenu, safeReply } from ".";
import { activeMenus } from "../DrinkMenu/state";
import { handleDrinkPages } from "../DrinkMenu/drinkPageHandler";
import { safeUpdate,
} from "../../components/DrinkMenu/index";

export async function handleCategorySelection(
	i: Interaction,
	categories: string[],
	userId: string
) {
	if (!i.isRepliable() || !i.channel) return;

	const categoryMenu = createCategorySelectMenu(categories);

	let categoryMessage = null;
	if (i.isButton() || i.isStringSelectMenu()) {
		categoryMessage = await safeUpdate(i, {
			content: "📋 Select a drink category:",
			components: [categoryMenu],
		});
	} else if (i.isCommand()) {
		categoryMessage = await safeReply(i, {
			content: "📋 Select a drink category:",
			components: [categoryMenu],
		});
	} else return;

	if (!categoryMessage) return; // interaction expired

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
