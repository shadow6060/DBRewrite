import { Message, User } from "discord.js";
import { db } from "../../database/database";
import { getUserInfo } from "../../database/userInfo";
import { text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";

export const command = new PrefixCommand("give", "Give someone some money.")
	.setCategory("economy")
	.setPrefixExecutor(async (message: Message, args: string[]) => {
		const [mention, amountStr] = args;

		// Validate arguments
		if (!mention || !amountStr) {
			await message.reply("Usage: `!give @User <amount>`");
			return;
		}

		// Extract user from mention
		const receiver = message.mentions.users.first() as User;
		if (!receiver) {
			await message.reply("Please mention a valid user to give money to.");
			return;
		}

		// Parse amount
		const tip = parseInt(amountStr, 10);
		if (isNaN(tip) || tip <= 0) {
			await message.reply("Please enter a valid positive amount.");
			return;
		}

		// Get sender's balance
		let userInfo = await getUserInfo(message.author.id);
		if (!userInfo) {
			await db.userInfo.create({ data: { id: message.author.id, balance: 0, donuts: 0 } });
			userInfo = (await getUserInfo(message.author.id))!;
		}

		if (userInfo.balance < tip) {
			await message.reply(text.common.notEnoughBalance);
			return;
		}

		// Limit transaction amount
		if (tip > 5000) {
			await message.reply("Funny this safety thing stopping your transaction of 5000+");
			return;
		}

		// Deduct money from sender
		await db.userInfo.update({ where: { id: message.author.id }, data: { balance: { decrement: tip } } });

		// Add money to receiver
		let receiverUserInfo = await getUserInfo(receiver.id);
		if (!receiverUserInfo) {
			await db.userInfo.create({ data: { id: receiver.id, balance: 0, donuts: 0 } });
			receiverUserInfo = (await getUserInfo(receiver.id))!;
		}

		await db.userInfo.update({ where: { id: receiver.id }, data: { balance: { increment: tip } } });

		await message.reply(`You successfully transferred \`$${tip}\` to <@${receiver.id}>`);
	});
