import { db } from "../../database/database";
import { upsertUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
import { getCooldownTimeRemaining, isOnCooldown, setCooldown } from "../../utils/cooldownManager";
import { PrefixCommand } from "../../structures/prefixCommand";

export const command = new PrefixCommand("crime", "Try your chances at doing crime!")
	.setCategory("economy")
	.setPrefixExecutor(async (message) => {
		const userId = message.author.id;

		// Check cooldown
		if (isOnCooldown(userId, "crime")) {
			const cooldownTime = getCooldownTimeRemaining(userId, "crime"); // Use a function to get remaining time
			await message.reply(
				format(text.errors.cooldown, pms(cooldownTime, { compact: true, secondsDecimalDigits: 1 }))
			);
			return;
		}

		const result = Math.random() < 0.5 ? "Failure" : "Success";
		const info = await upsertUserInfo(message.author);
		const obtained = randRange(...constants.crime.amountRange);

		// Set cooldown
		setCooldown(userId, "crime");

		if (result === "Failure") {
			await db.userInfo.update({ where: { id: info.id }, data: { balance: { decrement: obtained } } });
			await message.reply(format(sampleArray(text.commands.crime.failure), `\`$${-obtained}\``));
		} else {
			await db.userInfo.update({ where: { id: info.id }, data: { balance: { increment: obtained } } });
			await message.reply(format(sampleArray(text.commands.crime.sucess), `\`$${obtained}\``));
		}
	});
