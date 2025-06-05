import type {
	CommandInteraction} from "discord.js";
import {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType
} from "discord.js";
import { Command } from "../../structures/Command";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const command = new Command("expboard", "Shows the top EXP leaderboard.")
	.setExecutor(async (int: CommandInteraction) => {
		if (!int.guild) {
			await int.reply("This command can only be used in a server.");
			return;
		}

		const guildId = int.guild.id;

		// Fetch all users sorted by level & exp
		const allUsers = await prisma.guildsXP.findMany({
			where: { guildId },
			orderBy: [{ level: "desc" }, { exp: "desc" }],
		});

		if (allUsers.length === 0) {
			await int.reply("No EXP data found. Start chatting to gain XP!");
			return;
		}

		const usersPerPage = 10;
		let page = 0;

		// Embed generator
		const generateEmbed = async (page: number) => {
			const start = page * usersPerPage;
			const end = start + usersPerPage;
			const pageUsers = allUsers.slice(start, end);

			const leaderboard = await Promise.all(pageUsers.map(async (user, index) => {
				const member = await int.guild!.members.fetch(user.userId).catch(() => null);
				const name = member?.user.username ?? `<@${user.userId}>`;
				return `**#${start + index + 1}** — ${name}\nLevel: ${user.level} | EXP: ${user.exp}`;
			}));

			return new EmbedBuilder()
				.setTitle("🏆 EXP Leaderboard")
				.setDescription(leaderboard.join("\n\n"))
				.setFooter({ text: `Page ${page + 1} of ${Math.ceil(allUsers.length / usersPerPage)}` })
				.setColor("Gold");
		};

		const embed = await generateEmbed(page);

		// Button row
		const getRow = (disabled = false) =>
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId("prev")
					.setLabel("⬅️ Prev")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === 0 || disabled),
				new ButtonBuilder()
					.setCustomId("next")
					.setLabel("➡️ Next")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled((page + 1) * usersPerPage >= allUsers.length || disabled)
			);

		const reply = await int.reply({
			embeds: [embed],
			components: [getRow()],
			fetchReply: true,
		});

		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector.on("collect", async (i) => {
			if (i.user.id !== int.user.id) {
				await i.reply({ content: "❌ You can't control this leaderboard.", ephemeral: true });
				return;
			}

			if (i.customId === "prev") page--;
			else if (i.customId === "next") page++;

			const updatedEmbed = await generateEmbed(page);
			await i.update({ embeds: [updatedEmbed], components: [getRow()] });
		});

		collector.on("end", async () => {
			await reply.edit({ components: [getRow(true)] });
		});
	});
