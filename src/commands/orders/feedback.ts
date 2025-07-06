import { User, EmbedBuilder, TextChannel } from "discord.js";  // Import User type from discord.js
import { db } from "../../database/database";
import { getLatestOrder, OrderFlags,} from "../../database/orders";  // Assuming you have an Order type in your DB module
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import { Orders } from "@prisma/client";

// Utility function to create the embed and handle DB update
async function sendFeedbackEmbed(user: User, feedback: string, lastOrder: Orders) {
	const tcfe = text.commands.feedback.embed;
	const feedbackChannel = mainChannels.feedback as TextChannel;

	// Send the feedback to the public channel
	await feedbackChannel.send({
		embeds: [
			new EmbedBuilder()
				.setTitle(format(tcfe.title, lastOrder.id))
				.setDescription(feedback)
				.setFooter({
					text: format(tcfe.footer, user.username),
					iconURL: user.displayAvatarURL(),
				}),
		],
	});

	// Update the order in the database to mark feedback as given
	await db.orders.update({
		where: { id: lastOrder.id },
		data: { flags: lastOrder.flags | OrderFlags.FeedbackGiven },
	});
}

// Command definition
export const command = new Command("feedback", "Give feedback on your last order.")
	.setCategory("📨order")
	.addOption("string", (o) =>
		o.setName("feedback").setDescription("The feedback to give.").setRequired(true)
	)
	.setExecutor(async (int) => {
		// Type 'lastOrder' correctly as 'Order' type and 'user' as 'User'
		const lastOrder = await getLatestOrder(int.user);
		if (!lastOrder) {
			await int.reply(text.common.noOrders);  // Send reply if no orders exist
			return; // End execution if no last order
		}
		if (lastOrder.flags & OrderFlags.FeedbackGiven) {
			await int.reply(text.commands.feedback.alreadyGiven);  // If feedback already given
			return; // End execution early if feedback already given
		}

		// Get feedback value from the command option
		const feedback = int.options.getString("feedback", true);

		// Use the utility function to handle feedback embed and DB update
		await sendFeedbackEmbed(int.user, feedback, lastOrder);

		// Reply back to the user confirming their feedback
		await int.reply(format(text.commands.feedback.success, lastOrder.details));
	});
