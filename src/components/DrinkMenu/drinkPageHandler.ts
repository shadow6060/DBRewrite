import type {
	ButtonInteraction,
	StringSelectMenuInteraction,
	TextChannel,
} from "discord.js";
import {
	ComponentType,
	MessageFlags,
} from "discord.js";
import { PaymentType } from "@prisma/client";
import { db } from "../../database/database";
import { isManualMode } from "../../utils/MysticUtils/settings";
import { getUserBalance, updateBalance } from "../../database/userInfo";
import { addToTab, isTabBlocked } from "../../database/tab";
import { dismissEphemeral } from "../../utils/MysticUtils/ephemeralUtils";
import { cleanupActiveMenu } from "./cleanupActiveMenu";

import {
	createDrinkSelectMenu,
	createNavigationButtons,
	createConfirmationButtons,
	createCategorySelectMenu,
} from "../../components/DrinkMenuComp";
import { safeDeferUpdate, safeFollowUp, setCooldown } from "../../components/DrinkMenu/drinkMenuUtils";
import { activeMenus } from "../DrinkMenu/state";

import { createAndSendOrderEmbed } from "../../components/DrinkMenu/orderEmbeds";

const ITEMS_PER_PAGE = 4;
const NAV_BUTTON_COOLDOWN_MS = 2000; // ✅ Changed from 5000 to 2000

export async function handleDrinkPages(
	selectInteraction: StringSelectMenuInteraction | ButtonInteraction,
	category: string,
	categories: string[],
	userId: string
) {
	let currentPage = 0;
	const allDrinks = await db.drinkImage.findMany();
	const drinks = allDrinks.filter(d => d.category === category);
	const totalPages = Math.max(1, Math.ceil(drinks.length / ITEMS_PER_PAGE));

	const buttonCooldown = new Set<string>();

	const sendDrinkPage = async (interaction: StringSelectMenuInteraction | ButtonInteraction) => {
		if (interaction.deferred || interaction.replied) return;

		const pageDrinks = drinks
			.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
			.map(d => ({
				id: d.id,
				drinkName: d.drinkName,
				price: d.price ?? undefined,
			}));

		if (pageDrinks.length === 0) {
			await interaction.update({
				content: "No drinks available in this category.",
				components: [],
			});
			return;
		}

		const drinkRow = createDrinkSelectMenu(pageDrinks);
		const navRow = createNavigationButtons(currentPage, totalPages);

		await interaction.update({
			content: `🍹 Category: **${category}** — Page ${currentPage + 1}/${totalPages}`,
			components: [drinkRow, navRow],
		});
		activeMenus.set(userId, interaction.message.id);
	};

	setCooldown(buttonCooldown, userId, NAV_BUTTON_COOLDOWN_MS);

	await sendDrinkPage(selectInteraction);

	const collector = selectInteraction.channel?.createMessageComponentCollector({
		filter: i => (i.isButton() || i.isStringSelectMenu()) && i.user.id === userId,
		time: 300000,
		idle: 180000,
	});

	collector?.on("collect", async i => {
		if (i.isButton() && buttonCooldown.has(i.user.id)) {
			// ✅ Defer to suppress "Unknown interaction"
			await safeDeferUpdate(i);
			return;
		}

		if (i.isButton()) {
			setCooldown(buttonCooldown, i.user.id, NAV_BUTTON_COOLDOWN_MS);
		}

		if (i.isButton()) {
			if (i.customId === "prev_page") {
				currentPage = Math.max(0, currentPage - 1);
				await sendDrinkPage(i);
			} else if (i.customId === "next_page") {
				currentPage = Math.min(totalPages - 1, currentPage + 1);
				await sendDrinkPage(i);
			} else if (i.customId === "menu_back") {
				collector.stop();
				await safeDeferUpdate(i);
				await i.message.delete().catch(() => { /* empty */ });
				activeMenus.delete(userId);

				const categoryMenu = createCategorySelectMenu(categories);

				if (!i.channel || !("send" in i.channel)) return;

				if (activeMenus.has(userId)) {
					const oldMessageId = activeMenus.get(userId);
					try {
						const oldMsg = await i.channel.messages.fetch(oldMessageId!);
						await oldMsg.delete().catch(() => { /* empty */ });
					} catch { /* empty */ }
					activeMenus.delete(userId);
				}

				const categoryMessage = await (i.channel as TextChannel).send({
					content: "📋 Select a drink category:",
					components: [categoryMenu],
				});

				activeMenus.set(userId, categoryMessage.id);

				const catInt = await categoryMessage.awaitMessageComponent({
					componentType: ComponentType.StringSelect,
					time: 15000,
					filter: (intComp: StringSelectMenuInteraction) => intComp.user.id === userId,
				}).catch(() => null);

				if (!catInt || !catInt.isStringSelectMenu()) {
					await categoryMessage.delete().catch(() => { /* empty */ });
					activeMenus.delete(userId);
					return;
				}

				await handleDrinkPages(catInt, catInt.values[0], categories, userId);
			}
		} else if (i.isStringSelectMenu() && i.customId === "select_drink") {
			const drinkId = parseInt(i.values[0]);
			const drink = drinks.find(d => d.id === drinkId);
			if (!drink) return;

			const confirmRow = createConfirmationButtons(!!drink.price);

			await i.update({
				content: `**${drink.drinkName}** selected. ${drink.price ? `Price: $${drink.price}` : ""}`,
				components: [confirmRow],
			});

			const confirmCollector = i.channel?.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter: btnInt => btnInt.user.id === userId,
				time: 30000,
			});

			confirmCollector?.on("collect", async buttonInt => {
				if (buttonInt.customId === "cancel_order") {
					await safeDeferUpdate(buttonInt);
					await buttonInt.message.delete().catch(() => { /* empty */ });
					activeMenus.delete(userId);
					confirmCollector.stop();
					return;
				}

				if (buttonInt.customId === "confirm_order" || buttonInt.customId === "put_on_tab") {
					await safeDeferUpdate(buttonInt);

					if (buttonInt.customId === "confirm_order") {
						if (drink.price) {
							const { balance } = await getUserBalance(i.user.id);
							if (balance < drink.price) {
								await safeFollowUp(buttonInt, {
									content: `❌ Insufficient funds. You only have $${balance}.`,
									flags: MessageFlags.Ephemeral,
								});
								return;
							}
							await updateBalance(i.user.id, balance - drink.price);
						}
					} else {
						const blocked = await isTabBlocked(i.user.id, i.guildId!);
						if (blocked) {
							await safeFollowUp(buttonInt, {
								content: "❌ Your tab is blocked.",
								flags: MessageFlags.Ephemeral,
							});
							return;
						}
						await addToTab(i.user.id, i.guildId!, drink.price!);
						await dismissEphemeral(buttonInt);
					}

					const manualModeToUse = await isManualMode();

					await createAndSendOrderEmbed({
						interaction: buttonInt,
						drink,
						manualMode: manualModeToUse,
						paymentType: buttonInt.customId === "put_on_tab" ? PaymentType.TAB : PaymentType.BALANCE,
					});

					await safeFollowUp(buttonInt, {
						content:
							buttonInt.customId === "put_on_tab"
								? "✅ Order placed on your tab!"
								: `✅ Order placed successfully!${drink.price ? `\n💸 You have $${(await getUserBalance(i.user.id)).balance} left.` : ""}`,
						flags: MessageFlags.Ephemeral,
					});

					await buttonInt.message.delete().catch(() => { /* empty */ });
					activeMenus.delete(userId);
					confirmCollector.stop();
				}
			});
		}
	});

	collector?.on("end", async () => {
		await cleanupActiveMenu(userId, selectInteraction.channel as TextChannel);
	});
}

export { activeMenus };
