/* eslint-disable linebreak-style */
import { db } from "../../database/database";
import { upsertUserInfo, getUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
import { isOnCooldown, getCooldownTimeRemaining, setCooldown } from "../../utils/cooldownManager";

export const command = new Command("work", "Gets you some money.").setExecutor(
	async (int) => {
		const userId = int.user.id;

		// Check cooldown
		if (isOnCooldown(userId, "work")) {
			const cooldownTime = getCooldownTimeRemaining(userId, "work");
			await int.reply(
				format(
					text.errors.cooldown,
					pms(cooldownTime, { compact: true, secondsDecimalDigits: 1 })
				)
			);
			return;
		}

		// Ensure user exists in the database
		let info = await getUserInfo(userId);
		if (!info) {
			await db.userInfo.create({
				data: { id: userId, balance: 0, donuts: 0 }
			});
			info = (await getUserInfo(userId))!; // Ensure it's not null
		}

		// Calculate earnings
		const obtained = randRange(...constants.work.amountRange);

		// Set cooldown
		setCooldown(userId, "work");

		// Update balance
		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { increment: obtained } },
		});

		// Send response
		await int.reply(
			format(
				sampleArray(text.commands.work.responses),
				`\`$${obtained}\``
			)
		);
	}
);
