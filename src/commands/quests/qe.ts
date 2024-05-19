import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import { db } from "../../database/database"; // Replace with your database functions
import { permissions } from "../../providers/permissions"; // Assuming you have permissions defined

export const command = new Command("qe", "Edit or remove an existing quest.")
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
	.setExecutor(async (interaction: CommandInteraction) => {
		const subCommand = interaction.options.getSubcommand(true);

		try {
			if (subCommand === "edit") {
				const questId = interaction.options.getInteger("id", true);
				const newDescription = interaction.options.getString("description");
				const newCredits = interaction.options.getInteger("credits");
				const newGoal = interaction.options.getInteger("goal");
				const newReward = interaction.options.getString("reward");
				const newProgressBarLength = interaction.options.getInteger("progressbarlength");

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

				await interaction.reply(`Quest ${questId} updated successfully.`);

			} else if (subCommand === "delete") {
				const questId = interaction.options.getInteger("id", true);

				// Delete quest from database
				await db.quest.delete({
					where: { id: questId }
				});

				await interaction.reply(`Quest ${questId} deleted successfully.`);

			} else if (subCommand === "list") {
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

				await interaction.reply({ embeds: [embed] });

			} else {
				await interaction.reply("Invalid subcommand.");
			}
		} catch (error) {
			console.error("Error handling subcommand:", error);
			await interaction.reply("An error occurred while processing the subcommand.");
		}
	});
