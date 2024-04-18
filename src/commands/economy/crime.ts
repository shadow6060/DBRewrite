//crime.ts
import { db } from "../../database/database";
import { upsertUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";

const cooldowns: Record<string, number> = {};

export const command = new Command(
	"crime",
	"Try your chances on doing crime!"
).setExecutor(async ({ reply, user }) => {
	if (user.id in cooldowns && cooldowns[user.id] >= Date.now()) {
		await reply(
			format(
				text.errors.cooldown,
				pms(cooldowns[user.id] - Date.now(), {
					compact: true,
					secondsDecimalDigits: 1,
				})
			)
		);
		return;
	}
	const result = ["Successful", "Failure"];
	const answer = result[Math.floor(Math.random() * result.length)];
	if (answer === "Failure") {
		const info = await upsertUserInfo(user);
		const obtained = randRange(...constants.crime.amountRange);
		cooldowns[user.id] = Date.now() + constants.crime.cooldownMs;
		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { decrement: obtained } },
		});
		await reply(
			format(
				sampleArray(text.commands.crime.failure),
				`\`$${-obtained}\``
			)
		);
	} else {
		const info = await upsertUserInfo(user);
		const obtained = randRange(...constants.crime.amountRange);
		cooldowns[user.id] = Date.now() + constants.crime.cooldownMs;
		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { increment: obtained } },
		});
		await reply(
			format(sampleArray(text.commands.crime.sucess), `\`$${obtained}\``)
		);
	}
});
