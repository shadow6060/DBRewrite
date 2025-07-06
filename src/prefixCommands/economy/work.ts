/* eslint-disable linebreak-style */
import { db } from "../../database/database";
import { upsertUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { getCooldownTimeRemaining, isOnCooldown, setCooldown } from "../../utils/MysticUtils/cooldownManager";
import { randRange, sampleArray } from "../../utils/utils";

export const command = new PrefixCommand("work", "Gets you some money.")
	.setCategory("economy")
	.setPrefixExecutor(async (message) => {
		const userId = message.author.id;

		// Cooldown check
		if (isOnCooldown(userId, "work")) {
			const cooldownTime = getCooldownTimeRemaining(userId, "work");
			await message.reply(
				format(text.errors.cooldown, pms(cooldownTime, { compact: true, secondsDecimalDigits: 1 }))
			);
			return;
		}

		// Ensure user exists
		const info = await upsertUserInfo(message.author);
		const obtained = randRange(...constants.work.amountRange);

		// Set cooldown
		setCooldown(userId, "work");

		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { increment: obtained } },
		});

		await message.reply(format(sampleArray(text.commands.work.responses), `\`$${obtained}\``));
	});
