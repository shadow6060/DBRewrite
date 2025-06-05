/* eslint-disable linebreak-style */
import { db } from "../../database/database";
import { requireUserProfile } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
import { isOnCooldown, getCooldownTimeRemaining, setCooldown } from "../../utils/MysticUtils/cooldownManager";

export const command = new Command("work", "Gets you some money.")
	.setCategory("💲economy")
	.setExecutor(async (int) => {
		const userId = int.user.id;

		if (isOnCooldown(userId, "work")) {
			const cooldownTime = getCooldownTimeRemaining(userId, "work");
			await int.reply(
				format(text.errors.cooldown, pms(cooldownTime, { compact: true, secondsDecimalDigits: 1 }))
			);
			return;
		}

		const info = await requireUserProfile(userId, int);
		if (!info) return;

		const obtained = randRange(...constants.work.amountRange);

		setCooldown(userId, "work");

		await db.userInfo.update({
			where: { id: userId },
			data: { balance: { increment: obtained } },
		});

		await int.reply(
			format(sampleArray(text.commands.work.responses), `\`$${obtained}\``)
		);
	});
