import { getUserActiveOrder } from "../../database/orders";
import { text } from "../../providers/config";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { EmbedBuilder } from "discord.js";
import { Message } from "discord.js"; // Import Message type

export const command = new Command("status", "Checks the status of your current order.")
	.addPermission(permissions.employee)
	.setExecutor(async int => {
		// This part handles slash command execution
		await handleOrderStatus(int);
	});

// New method to handle prefix command execution
command.executeMessage = async (message: Message, args: string[]) => {
	// Check if the message member exists
	const member = message.member;
	if (!member) {
		return message.reply("You are not a member of this guild.");
	}

	// Check if the user has permission to execute this command
	if (!permissions.employee.hasPermission(member)) {
		return message.reply("You do not have permission to use this command.");
	}

	// Proceed with handling the order status
	await handleOrderStatus(message);
};

// Shared logic for both slash and prefix command executions
const handleOrderStatus = async (interactionOrMessage: any) => {
	const user = interactionOrMessage.user || interactionOrMessage.author; // Get user from interaction or message
	const order = await getUserActiveOrder(user);
	if (!order) {
		await interactionOrMessage.reply(text.common.noActiveOrder);
		return;
	}
	const embed = new EmbedBuilder()
		.setColor("#0099ff")
		.setTitle("Order Status")
		.setDescription(`The status of your order is ${order.status}.`);

	if (interactionOrMessage.reply) {
		// If it's a command interaction
		await interactionOrMessage.reply({ embeds: [embed] });
	} else {
		// If it's a message command
		await interactionOrMessage.reply({ embeds: [embed] });
	}
};
