import { db } from "../../database/database";
import { upsertUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { getCooldownTimeRemaining, isOnCooldown, setCooldown } from "../../utils/MysticUtils/cooldownManager";
import { randRange, sampleArray } from "../../utils/utils";

export const command = new PrefixCommand("daily", "Get your daily income!")
	.setCategory("economy")
	.setPrefixExecutor(async (message) => {
		const userId = message.author.id;

		// Cooldown check
		if (isOnCooldown(userId, "daily")) {
			const cooldownTime = getCooldownTimeRemaining(userId, "daily");
			await message.reply(
				format(text.errors.cooldown, pms(cooldownTime, { compact: true, secondsDecimalDigits: 1 }))
			);
			return;
		}

		// Ensure user exists
		const info = await upsertUserInfo(message.author);
		const obtained = randRange(...constants.daily.amountRange);

		// Set cooldown
		setCooldown(userId, "daily");

		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { increment: obtained } },
		});

		await message.reply(format(sampleArray(text.commands.daily.responses), `\`$${obtained}\``));
	});
