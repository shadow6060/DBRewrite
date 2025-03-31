/* eslint-disable linebreak-style */
/* eslint-disable quotes */
// work.ts
import { db } from "../../database/database";
import { upsertUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";

const cooldowns: Record<string, number> = {};

export const command = new PrefixCommand("work", "Gets you some money.")
	.setCategory("economy")
	.setPrefixExecutor(async (message) => {
		const userId = message.author.id;

		// Check if the user is on cooldown
		if (cooldowns[userId] && cooldowns[userId] >= Date.now()) {
			await message.reply(
				format(
					text.errors.cooldown,
					pms(cooldowns[userId] - Date.now(), {
						compact: true,
						secondsDecimalDigits: 1,
					})
				)
			);
			return;
		}

		// Update user balance
		const info = await upsertUserInfo(message.author);
		const obtained = randRange(...constants.work.amountRange);
		cooldowns[userId] = Date.now() + constants.work.cooldownMs;

		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { increment: obtained } },
		});

		// Reply with formatted message
		await message.reply(
			format(sampleArray(text.commands.work.responses), `\`$${obtained}\``)
		);
	});
