/* eslint-disable indent */
import { getAllActiveOrders } from "../../../database/orders";
import { client } from "../../../providers/client";
import { text } from "../../../providers/config";
import { permissions } from "../../../providers/permissions";
import { CommandInteraction, EmbedBuilder, ComponentType, ButtonBuilder, ButtonStyle, Interaction, MessageComponentInteraction } from "discord.js";
import { CafeStatus, OrderStatus } from "@prisma/client";
import { ExtendedCommand } from "../../../structures/extendedCommand";
import pms from "pretty-ms";
import { format } from "../../../utils/string";

// Define the command options
interface CommandOptions {
	name: string; // Ensure that 'name' is explicitly defined as a string
	description?: string;
	// Other properties as needed
}

const ITEMS_PER_PAGE = 10; // Number of orders per page

// Create the command using ExtendedCommand class
export const command = new ExtendedCommand({ name: "list", description: "Lists active orders.", local: true })
	.addPermission(permissions.employee)
	.setExecutor(async (int: CommandInteraction) => {
		const orders = await getAllActiveOrders();

		if (orders.length === 0) {
			await int.reply(">>> There are no active orders.");
			return;
		}

		// Sort orders by creation time, oldest first
		orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

		let page = 0;
		let oldestFirst = true;

		const generateEmbed = (page: number, oldestFirst: boolean) => {
			const sortedOrders = oldestFirst
				? orders
				: [...orders].reverse(); // Reverse for newest first

			const paginatedOrders = sortedOrders.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
			const txt = text.commands.list;
			const orderCount = orders.length;

			const description = paginatedOrders
				.map(x => `${format(txt.parts.id, x.id)}: \
${format(txt.parts.status, text.statuses[x.status] ?? x.status)}\
 - ${format(txt.parts.details, x.details)}\
 - ${format(txt.parts.time, `${pms(Date.now() - x.createdAt.getTime(), { verbose: true, unitCount: 1 })} ago`)}\
 ${x.status === OrderStatus.Unprepared ? "- **UNCLAIMED**" : x.status === OrderStatus.Preparing ? `- **Claimed by ${(x.claimer ? client.users.cache.get(x.claimer)?.username : undefined) ?? "Unknown User"
						}**` : ""}
`)
				.join("\n");

			return new EmbedBuilder()
				.setTitle(`${txt.title} - Page ${page + 1}`)
				.setDescription(description || txt.empty)
				.setFooter({ text: `Total Orders: ${orderCount}` })
				.setColor("#00FF00");
		};

		const generateButtons = (page: number, oldestFirst: boolean) => {
			return [
				new ButtonBuilder()
					.setCustomId("prev_page")
					.setLabel("Previous")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === 0),
				new ButtonBuilder()
					.setCustomId("next_page")
					.setLabel("Next")
					.setStyle(ButtonStyle.Primary)
					.setDisabled((page + 1) * ITEMS_PER_PAGE >= orders.length),
				new ButtonBuilder()
					.setCustomId("toggle_sort")
					.setLabel(oldestFirst ? "Show Newest First" : "Show Oldest First")
					.setStyle(ButtonStyle.Secondary)
			];
		};

		await int.reply({
			embeds: [generateEmbed(page, oldestFirst)],
			components: [
				{
					type: ComponentType.ActionRow,
					components: generateButtons(page, oldestFirst),
				},
			],
			ephemeral: true,
		});

		const filter = (i: Interaction) => i.user.id === int.user.id;

		if (!int.channel) {
			await int.editReply({ content: "Channel not found.", components: [] });
			return;
		}

		const collector = int.channel.createMessageComponentCollector({ filter, time: 60000 });

		collector.on("collect", async (i: MessageComponentInteraction) => {
			if (i.customId === "prev_page") {
				page = Math.max(page - 1, 0);
			} else if (i.customId === "next_page") {
				page = Math.min(page + 1, Math.floor(orders.length / ITEMS_PER_PAGE));
			} else if (i.customId === "toggle_sort") {
				oldestFirst = !oldestFirst;
				page = 0; // Reset to first page when sorting order is toggled
			}

			await i.update({
				embeds: [generateEmbed(page, oldestFirst)],
				components: [
					{
						type: ComponentType.ActionRow,
						components: generateButtons(page, oldestFirst),
					},
				],
			});
		});

		collector.on("end", collected => {
			if (collected.size === 0) {
				int.editReply({ components: [] });
			}
		});
	});
