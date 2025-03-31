import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType, Interaction } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database";

export const command = new Command("drinkmenu", "Shows the drink menu.")
	.setExecutor(async (interaction: CommandInteraction) => {
		// Fetch drinks from the database and group them by category
		const drinks = await db.drinkImage.findMany({
			select: { drinkName: true, category: true },
		});

		if (drinks.length === 0) {
			await interaction.reply("No drinks found in the database.");
			return;
		}

		// Group drinks by category
		const drinkCategories: Record<string, string[]> = {};
		for (const drink of drinks) {
			const category = drink.category || "Miscellaneous";
			if (!drinkCategories[category]) drinkCategories[category] = [];
			drinkCategories[category].push(drink.drinkName);
		}

		const categoryList = Object.keys(drinkCategories);
		let currentPage = 0;
		let inCategoryView = false; // Track if we're inside a category view

		// Function to create buttons for categories (5 per page)
		const createCategoryButtons = (page: number) => {
			const rows: ActionRowBuilder<ButtonBuilder>[] = [];
			const categoriesOnPage = categoryList.slice(page * 5, page * 5 + 5);

			const row = new ActionRowBuilder<ButtonBuilder>();
			for (const category of categoriesOnPage) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`category_${category}`)
						.setLabel(category)
						.setStyle(ButtonStyle.Primary)
				);
			}

			if (row.components.length > 0) rows.push(row);

			// Pagination buttons
			const paginationRow = new ActionRowBuilder<ButtonBuilder>();
			paginationRow.addComponents(
				new ButtonBuilder()
					.setCustomId("previous")
					.setLabel("Previous")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === 0),
				new ButtonBuilder()
					.setCustomId("next")
					.setLabel("Next")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(categoriesOnPage.length < 5)
			);

			rows.push(paginationRow);
			return rows;
		};

		// Function to generate drink list for a category
		const generateCategoryEmbed = (category: string): EmbedBuilder => {
			const drinksInCategory = drinkCategories[category] || [];
			const drinkList = drinksInCategory.map(d => `• ${d}`).join("\n") || "No drinks available.";

			return new EmbedBuilder()
				.setTitle(`🥤 ${category} Drinks`)
				.setDescription(drinkList)
				.setColor("#3498db");
		};

		// Function to generate the main menu embed
		const generateMainMenuEmbed = (): EmbedBuilder => {
			return new EmbedBuilder()
				.setTitle("📜 Drink Menu")
				.setDescription("Select a category below to view available drinks.")
				.setColor("#f1c40f");
		};

		// Send initial message
		await interaction.reply({
			embeds: [generateMainMenuEmbed()],
			components: createCategoryButtons(currentPage),
		});

		const message = await interaction.fetchReply();

		// Button collector
		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60000,
		});

		collector.on("collect", async (buttonInteraction: Interaction) => {
			if (!buttonInteraction.isButton()) return;

			// Ensure only the original user can interact
			if (buttonInteraction.user.id !== interaction.user.id) {
				await buttonInteraction.reply({ content: "You can't use this button!", ephemeral: true });
				return;
			}

			const [action, category] = buttonInteraction.customId.split("_");

			if (action === "category") {
				inCategoryView = true;
				await buttonInteraction.update({
					embeds: [generateCategoryEmbed(category)],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId("back")
								.setLabel("⬅ Back")
								.setStyle(ButtonStyle.Danger)
						)
					],
				});
			} else if (buttonInteraction.customId === "back") {
				inCategoryView = false;
				await buttonInteraction.update({
					embeds: [generateMainMenuEmbed()],
					components: createCategoryButtons(currentPage),
				});
			} else if (action === "previous" && !inCategoryView) {
				currentPage--;
				await buttonInteraction.update({
					embeds: [generateMainMenuEmbed()],
					components: createCategoryButtons(currentPage),
				});
			} else if (action === "next" && !inCategoryView) {
				currentPage++;
				await buttonInteraction.update({
					embeds: [generateMainMenuEmbed()],
					components: createCategoryButtons(currentPage),
				});
			}
		});

		// Expire buttons after timeout
		collector.on("end", async () => {
			await interaction.editReply({
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder().setCustomId("expired").setLabel("Expired").setStyle(ButtonStyle.Secondary).setDisabled(true)
					),
				],
			});
		});
	});
