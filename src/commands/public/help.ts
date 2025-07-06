import type { MessageComponentInteraction } from "discord.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	StringSelectMenuBuilder,
} from "discord.js";
import { Command } from "../../structures/Command";
import { slashCommandRegistry } from "../../providers/commandManager";
import type { ChatInputCommandInteraction } from "discord.js";

const groupCommandsByCategory = (commands: Command[]) => {
	const categories: Record<string, Command[]> = {};
	for (const cmd of commands) {
		const category = cmd.category || "Miscellaneous";
		if (!categories[category]) categories[category] = [];
		categories[category].push(cmd);
	}
	return categories;
};

export const command = new Command("help", "Displays all available commands").setExecutor(
	async (interaction: ChatInputCommandInteraction) => {
		await interaction.deferReply();

		const availableCommands = (
			await Promise.all(
				slashCommandRegistry.map(async (cmd: Command | null) => {
					if (!cmd) return null;
					if (cmd.permissions.length === 0) return cmd;
					for (const permission of cmd.permissions) {
						const hasPermission = await permission.hasPermission(interaction.user);
						if (hasPermission) return cmd;
					}
					return null;
				})
			)
		).filter(Boolean) as Command[];

		if (availableCommands.length === 0) {
			await interaction.editReply("You don't have permission to use any commands.");
			return;
		}

		const commandCategories = groupCommandsByCategory(availableCommands);

		let currentCommandPage = 0;
		let currentCategoryPage = 0;
		let currentCategory: string | null = null;
		const commandPageSize = 8;
		const categoryPageSize = 5;
		let inCategoryView = false;

		const renderCategorySelect = (page: number) => {
			const categories = Object.keys(commandCategories);
			const start = page * categoryPageSize;
			const end = start + categoryPageSize;
			const sliced = categories.slice(start, end);

			const categoryMenu = new StringSelectMenuBuilder()
				.setCustomId("help_category_select")
				.setPlaceholder("Choose a category")
				.addOptions(
					sliced.map((category) => ({
						label: category,
						value: category,
						description: `${commandCategories[category].length} command(s)`,
					}))
				);

			const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(categoryMenu);
			const buttonRow = new ActionRowBuilder<ButtonBuilder>();

			if (page > 0) {
				buttonRow.addComponents(
					new ButtonBuilder()
						.setCustomId("category_page_back")
						.setLabel("⬅️ Back")
						.setStyle(ButtonStyle.Primary)
				);
			}
			if (end < categories.length) {
				buttonRow.addComponents(
					new ButtonBuilder()
						.setCustomId("category_page_next")
						.setLabel("Next ➡️")
						.setStyle(ButtonStyle.Primary)
				);
			}

			return [menuRow, ...(buttonRow.components.length ? [buttonRow] : [])];
		};

		const renderCommandSelect = (category: string, page: number) => {
			const commands = commandCategories[category];
			const start = page * commandPageSize;
			const end = start + commandPageSize;
			const pageCommands = commands.slice(start, end);

			const commandMenu = new StringSelectMenuBuilder()
				.setCustomId("help_command_select")
				.setPlaceholder("Select a command for details")
				.addOptions(
					pageCommands.map((cmd) => ({
						label: `/${cmd.name}`,
						value: cmd.name,
						description: cmd.description?.slice(0, 50) || "No description",
					}))
				);

			const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(commandMenu);
			const buttonRow = new ActionRowBuilder<ButtonBuilder>();

			if (page > 0) {
				buttonRow.addComponents(
					new ButtonBuilder()
						.setCustomId("page_back")
						.setLabel("⬅️ Back Page")
						.setStyle(ButtonStyle.Primary)
				);
			}
			if (end < commands.length) {
				buttonRow.addComponents(
					new ButtonBuilder()
						.setCustomId("page_next")
						.setLabel("Next Page ➡️")
						.setStyle(ButtonStyle.Primary)
				);
			}
			buttonRow.addComponents(
				new ButtonBuilder()
					.setCustomId("back_to_categories")
					.setLabel("🏠 Back to Categories")
					.setStyle(ButtonStyle.Secondary)
			);

			return [menuRow, buttonRow];
		};

		await interaction.editReply({
			content: "Select a category to view commands:",
			components: renderCategorySelect(currentCategoryPage),
		});

		const collector = interaction.channel?.createMessageComponentCollector({
			time: 120000,
			filter: (component) => component.user.id === interaction.user.id,
		});

		collector?.on("collect", async (component: MessageComponentInteraction) => {
			if (component.user.id !== interaction.user.id) {
				await component.reply({ content: "This menu isn't for you!", ephemeral: true });
				return;
			}

			if (component.isStringSelectMenu()) {
				if (component.customId === "help_category_select") {
					currentCategory = component.values[0];
					currentCommandPage = 0;
					inCategoryView = true;

					await component.update({
						content: `Category: **${currentCategory}**\nNow select a command:`,
						components: renderCommandSelect(currentCategory, currentCommandPage),
						embeds: [],
					});
				} else if (component.customId === "help_command_select") {
					const selectedCommandName = component.values[0];
					const selectedCommand = availableCommands.find(
						(cmd) => cmd.name === selectedCommandName
					);
					if (!selectedCommand) {
						await component.reply({ content: "Couldn't find that command.", ephemeral: true });
						return;
					}

					const embed = new EmbedBuilder()
						.setTitle(`📖 Command: /${selectedCommand.name}`)
						.setColor("#5865f2")
						.addFields(
							{
								name: "Description",
								value: selectedCommand.description || "No description",
								inline: false,
							},
							{
								name: "Usage",
								value: selectedCommand.usage || "No usage available",
								inline: false,
							},
							{
								name: "Category",
								value: selectedCommand.category || "Miscellaneous",
								inline: true,
							}
						)
						.setFooter({ text: "Use the select menu to explore more!" });

					await component.update({
						content: `Info for **/${selectedCommand.name}**`,
						components: renderCommandSelect(currentCategory as string, currentCommandPage),
						embeds: [embed],
					});
				}
			} else if (component.isButton()) {
				switch (component.customId) {
					case "page_back":
						if (currentCommandPage > 0) currentCommandPage--;
						await component.update({
							content: `Category: **${currentCategory}**\nNow select a command:`,
							components: renderCommandSelect(currentCategory as string, currentCommandPage),
							embeds: [],
						});
						break;
					case "page_next":
						currentCommandPage++;
						await component.update({
							content: `Category: **${currentCategory}**\nNow select a command:`,
							components: renderCommandSelect(currentCategory as string, currentCommandPage),
							embeds: [],
						});
						break;
					case "back_to_categories":
						inCategoryView = false;
						currentCategory = null;
						currentCommandPage = 0;
						await component.update({
							content: "Select a category to view commands:",
							components: renderCategorySelect(currentCategoryPage),
							embeds: [],
						});
						break;
					case "category_page_back":
						if (currentCategoryPage > 0) currentCategoryPage--;
						await component.update({
							content: "Select a category to view commands:",
							components: renderCategorySelect(currentCategoryPage),
							embeds: [],
						});
						break;
					case "category_page_next":
						currentCategoryPage++;
						await component.update({
							content: "Select a category to view commands:",
							components: renderCategorySelect(currentCategoryPage),
							embeds: [],
						});
						break;
				}
			}
		});

		collector?.on("end", async (_, reason) => {
			if (!interaction.channel) return;
			await interaction.editReply({
				content: reason === "time" ? "Command expired." : "The help menu has been updated.",
				components: [],
			});
		});
	}
);
