//crime.ts
import {db} from "../database/database";
import {upsertUserInfo} from "../database/userInfo";
import {constants, text} from "../providers/config";
import {Command} from "../structures/Command";
import {format} from "../utils/string";
import pms from "pretty-ms";
import {randRange, sampleArray} from "../utils/utils";

const cooldowns: Record<string, number> = {};

export const command = new Command("crime", "Try your chances on doing crime!")
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
		const result = [
			"Succesful",
			"Failure"
		];
		const awnser = result[Math.floor(Math.random() * result.length)];
		if (awnser === "Failure") {
			const info = await upsertUserInfo(int.user, int.guild?.id || '');
			const obtained = randRange(...constants.crime.amountRange);
			cooldowns[int.user.id] = Date.now() + constants.crime.cooldownMs;
			await db.userInfo.update({ where: { id: info.id }, data: { balance: { decrement: obtained } } });
			await int.reply(format(sampleArray(text.commands.crime.failure), `\`$${-obtained}\``));
		} else {
			const info = await upsertUserInfo(int.user, int.guild?.id || '');
			const obtained = randRange(...constants.crime.amountRange);
			cooldowns[int.user.id] = Date.now() + constants.crime.cooldownMs;
			await db.userInfo.update({ where: { id: info.id }, data: { balance: { increment: obtained } } });
			await int.reply(format(sampleArray(text.commands.crime.sucess), `\`$${obtained}\``));
		}
	});
