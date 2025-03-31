import { db } from "../../database/database";
import { upsertUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { PrefixCommand } from "../../structures/prefixCommand";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";

const cooldowns: Record<string, number> = {};

export const command = new PrefixCommand("crime", "Try your chances at doing crime!")
	.setCategory("economy")
	.setPrefixExecutor(async (message, args) => {
		if (message.author.id in cooldowns && cooldowns[message.author.id] >= Date.now()) {
			await message.reply(
				format(
					text.errors.cooldown,
					pms(cooldowns[message.author.id] - Date.now(), { compact: true, secondsDecimalDigits: 1 })
				)
			);
			return;
		}

		const result = Math.random() < 0.5 ? "Failure" : "Success";
		const info = await upsertUserInfo(message.author);
		const obtained = randRange(...constants.crime.amountRange);
		cooldowns[message.author.id] = Date.now() + constants.crime.cooldownMs;

		if (result === "Failure") {
			await db.userInfo.update({ where: { id: info.id }, data: { balance: { decrement: obtained } } });
			await message.reply(format(sampleArray(text.commands.crime.failure), `\`$${-obtained}\``));
		} else {
			await db.userInfo.update({ where: { id: info.id }, data: { balance: { increment: obtained } } });
			await message.reply(format(sampleArray(text.commands.crime.sucess), `\`$${obtained}\``));
		}
	});
