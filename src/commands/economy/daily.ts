//daily.ts
import { db } from "../../database/database";
import { upsertUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
const cooldowns: Record<string, number> = {};

export const command = new Command("daily", "Get your daily income!.")
	.setExecutor(async int => {
		if (int.user.id in cooldowns && cooldowns[int.user.id] >= Date.now()) {
			await int.reply(
				format(
					text.errors.cooldown,
					pms(cooldowns[int.user.id] - Date.now(), { compact: true, secondsDecimalDigits: 1 })
				)
			);
			return;
		}
		const info = await upsertUserInfo(int.user, int.guild?.id || '');
		const obtained = randRange(...constants.daily.amountRange);
		cooldowns[int.user.id] = Date.now() + constants.daily.cooldownMs;
		await db.userInfo.update({ where: { id: info.id }, data: { balance: { increment: obtained } } });
		await int.reply(format(sampleArray(text.commands.daily.responses), `\`$${obtained}\``));
	});