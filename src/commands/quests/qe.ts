import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database"; // Replace with your database functions
import { permissions } from "../../providers/permissions"; // Assuming you have permissions defined
import { ExtendedCommand } from "../../structures/extendedCommand";
export const command = new ExtendedCommand({ name: "qe", description: "Edit or remove an existing quest.", local: true })
	.addPermission(permissions.developer)
	.addSubCommand(subcommand =>
		subcommand
			.setName("edit")
			.setDescription("Edit an existing quest.")
			.addIntegerOption(option =>
				option.setName("id")
					.setDescription("ID of the quest to edit.")
					.setRequired(true)
			)
			.addStringOption(option =>
				option.setName("description")
					.setDescription("New description for the quest.")
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName("credits")
					.setDescription("New number of credits rewarded for completing the quest.")
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName("goal")
					.setDescription("New number of tasks to complete for this quest.")
					.setRequired(false)
			)
			.addStringOption(option =>
				option.setName("reward")
					.setDescription("New reward for completing the quest.")
					.setRequired(false)
			)
			.addIntegerOption(option =>
				option.setName("progressbarlength")
					.setDescription("New length of the progress bar for this quest.")
					.setRequired(false)
			)
	)
	.addSubCommand(subcommand =>
		subcommand
			.setName("delete")
			.setDescription("Delete an existing quest.")
			.addIntegerOption(option =>
				option.setName("id")
					.setDescription("ID of the quest to delete.")
					.setRequired(true)
			)
	)
	.addSubCommand(subcommand =>
		subcommand
			.setName("list")
			.setDescription("List all existing quests.")
	)
	.setExecutor(async (int: CommandInteraction) => {
		try {
			const subcommand = (int.options as any).getSubcommand(true);

			switch (subcommand) {
				case "edit": {
					const questId = parseInt(int.options.get("id")?.value?.toString() ?? "0", 10);
					const newDescription = int.options.get("description")?.value?.toString();
					const newCredits = parseInt(int.options.get("credits")?.value?.toString() ?? "0", 10);
					const newGoal = parseInt(int.options.get("goal")?.value?.toString() ?? "0", 10);
					const newReward = int.options.get("reward")?.value?.toString();
					const newProgressBarLength = parseInt(int.options.get("progressbarlength")?.value?.toString() ?? "0", 10);

					// Prepare data to update
					const dataToUpdate: any = {};
					if (newDescription !== null) dataToUpdate.description = newDescription;
					if (newCredits !== null) dataToUpdate.credits = newCredits;
					if (newGoal !== null) dataToUpdate.goal = newGoal;
					if (newReward !== null) dataToUpdate.reward = newReward;
					if (newProgressBarLength !== null) dataToUpdate.progressBarLength = newProgressBarLength;

					// Update quest in database
					await db.quest.update({
						where: { id: questId },
						data: dataToUpdate,
					});

					await int.reply(`Quest ${questId} updated successfully.`);
					break;
				}
				case "delete": {
					const questId = parseInt(int.options.get("id")?.value?.toString() ?? "0", 10);

					// Delete quest from database
					await db.quest.delete({
						where: { id: questId }
					});

					await int.reply(`Quest ${questId} deleted successfully.`);
					break;
				}
				case "list": {
					const quests = await db.quest.findMany();

					// Create embed to display quests
					const embed = new EmbedBuilder()
						.setTitle("List of Quests")
						.setDescription("Here are all existing quests:");

					quests.forEach((quest, index) => {
						embed.addFields({
							name: `Quest ${index + 1}`,
							value: `ID: ${quest.id}\nDescription: ${quest.description}\nGoal: ${quest.goal}\nReward: ${quest.reward}\nCredits: ${quest.credits}\nProgress Bar Length: ${quest.progressBarLength}`,
							inline: false,
						});
					});

					await int.reply({ embeds: [embed] });
					break;
				}
				default:
					await int.reply("Invalid subcommand.");
					break;
			}
		} catch (error) {
			console.error("Error handling subcommand:", error);
			await int.reply("An error occurred while processing the subcommand.");
		}
	});
