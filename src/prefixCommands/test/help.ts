import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType, Message, Interaction } from "discord.js";
import { PrefixCommand } from "../../structures/prefixCommand"; // Ensure this file exists
import { prefixCommandRegistry } from "../../providers/commandManager"; // Ensure this file exists

const groupCommandsByCategory = (commands: PrefixCommand[]) => {
	const categories: Record<string, PrefixCommand[]> = {};

	commands.forEach((cmd: PrefixCommand) => {
		const category = cmd.category || "Miscellaneous";
		if (!categories[category]) categories[category] = [];
		categories[category].push(cmd);
	});

	return categories;
};

export const command = new PrefixCommand("help", "Displays a list of available commands")
	.setPrefixExecutor(async (message: Message) => {
		const availableCommands = (
			await Promise.all(
				prefixCommandRegistry.map(async (cmd: PrefixCommand | null) => {
					if (!cmd) return null;
					if (cmd.permissions.length === 0) {
						return cmd;
					}
					for (const permission of cmd.permissions) {
						const hasPermission = await permission.hasPermission(message.author);
						if (hasPermission) return cmd;
					}
					return null;
				})
			)
		).filter(Boolean) as PrefixCommand[];

		if (availableCommands.length === 0) {
			await message.reply("You don't have permission to use any commands.");
			return;
		}

		const commandCategories = groupCommandsByCategory(availableCommands);

		// Function to create buttons for categories
		const createCategoryButtons = async (page: number) => {
			const rows: ActionRowBuilder<ButtonBuilder>[] = [];
			const categoriesOnPage = Object.keys(commandCategories).slice(page * 5, page * 5 + 5);

			const row = new ActionRowBuilder<ButtonBuilder>();
			for (const category of categoriesOnPage) {
				let userHasPermission = false;

				for (const cmd of commandCategories[category]) {
					const permissionChecks = await Promise.all(
						cmd.permissions.map((permission: any) => permission.hasPermission(message.author))
					);
					if (cmd.permissions.length === 0 || permissionChecks.some((perm: boolean) => perm)) {
						userHasPermission = true;
						break;
					}
				}

				if (userHasPermission) {
					const hasSpecialAccess = commandCategories[category].some((cmd) => cmd.permissions.length > 0);
					row.addComponents(
						new ButtonBuilder()
							.setCustomId(`category_${category}`)
							.setLabel(category)
							.setStyle(hasSpecialAccess ? ButtonStyle.Danger : ButtonStyle.Success) // Red for special access, Green for public
					);
				}
			}

			// If there are any buttons in the row, push it to the rows array
			if (row.components.length > 0) {
				rows.push(row);
			}

			// Add pagination buttons to a new row
			const paginationRow = new ActionRowBuilder<ButtonBuilder>();
			paginationRow.addComponents(
				new ButtonBuilder()
					.setCustomId("previous")
					.setLabel("Previous")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === 0)
			);
			paginationRow.addComponents(
				new ButtonBuilder()
					.setCustomId("next")
					.setLabel("Next")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(categoriesOnPage.length < 5)
			);

			rows.push(paginationRow); // Add pagination row

			return rows;
		};

		const generateCategoryEmbed = (category: string): EmbedBuilder => {
			const commands = commandCategories[category];
			if (!commands) {
				return new EmbedBuilder()
					.setTitle("📜 Command List")
					.setDescription(`No commands available in the **${category}** category.`)
					.setColor("#e74c3c");
			}

			const commandList = commands
				.map((cmd) => `**${cmd.name}** - ${cmd.description || "No description available"}`)
				.join("\n");

			return new EmbedBuilder()
				.setTitle("📜 Command List")
				.setDescription(commandList)
				.setColor("#3498db");
		};

		let currentPage = 0;
		const helpMessage = await message.channel.send({
			embeds: [generateCategoryEmbed("Miscellaneous")],
			components: (await createCategoryButtons(currentPage)).map(row => row.toJSON()),
		});

		const collector = helpMessage.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60000,
		});

		collector.on("collect", async (interaction: Interaction) => {
			if (!interaction.isButton()) return;

			if (interaction.user.id !== message.author.id) {
				await interaction.reply({ content: "You can't use this button!", ephemeral: true });
				return;
			}

			const [action, category] = interaction.customId.split("_");

			if (action === "category") {
				await interaction.update({
					embeds: [generateCategoryEmbed(category)],
					components: (await createCategoryButtons(currentPage)).map(row => row.toJSON()),
				});
			} else if (action === "previous") {
				currentPage--;
				await interaction.update({
					embeds: [generateCategoryEmbed("Miscellaneous")],
					components: (await createCategoryButtons(currentPage)).map(row => row.toJSON()),
				});
			} else if (action === "next") {
				currentPage++;
				await interaction.update({
					embeds: [generateCategoryEmbed("Miscellaneous")],
					components: (await createCategoryButtons(currentPage)).map(row => row.toJSON()),
				});
			}
		});

		collector.on("end", async () => {
			await helpMessage.edit({
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder().setCustomId("expired").setLabel("Expired").setStyle(ButtonStyle.Secondary).setDisabled(true)
					).toJSON(),
				],
			});
		});
	});
