/* eslint-disable quotes */
/* eslint-disable linebreak-style */
//work.ts
import { db } from "../../database/database";
import { upsertUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";

const cooldowns: Record<string, number> = {};

export const command = new Command("work", "Gets you some money.").setExecutor(
	async (int) => {
		if (int.user.id in cooldowns && cooldowns[int.user.id] >= Date.now()) {
			await int.reply(
				format(
					text.errors.cooldown,
					pms(cooldowns[int.user.id] - Date.now(), {
						compact: true,
						secondsDecimalDigits: 1,
					})
				)
			);
			return;
		}
		const info = await upsertUserInfo(int.user);
		const obtained = randRange(...constants.work.amountRange);
		cooldowns[int.user.id] = Date.now() + constants.work.cooldownMs;
		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { increment: obtained } },
		});
		await int.reply(
			format(
				sampleArray(text.commands.work.responses),
				`\`$${obtained}\``
			)
		);
	}
);
