import { db } from "../../database/database";
import { constants, text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
import { isOnCooldown, getCooldownTimeRemaining, setCooldown } from "../../utils/MysticUtils/cooldownManager";
import { requireUserProfile } from "../../database/userInfo";

export const command = new Command("daily", "Get your daily income!")
	.setCategory("💲economy")
	.setExecutor(async (int) => {
		const userId = int.user.id;

		if (isOnCooldown(userId, "daily")) {
			const timeLeft = getCooldownTimeRemaining(userId, "daily");
			await int.reply(
				format(text.errors.cooldown, pms(timeLeft, { compact: true, secondsDecimalDigits: 1 }))
			);
			return;
		}

		const profile = await requireUserProfile(userId, int);
		if (!profile) return;

		const earned = randRange(...constants.daily.amountRange);
		setCooldown(userId, "daily");

		await db.userInfo.update({
			where: { id: userId },
			data: { balance: { increment: earned } },
		});

		await int.reply(format(sampleArray(text.commands.daily.responses), `\`$${earned}\``));
	});
