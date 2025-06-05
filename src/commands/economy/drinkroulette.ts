/* eslint-disable linebreak-style */
// commands/economy/drinkroulette.ts
import { db } from "../../database/database";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
import { isOnCooldown, getCooldownTimeRemaining, setCooldown } from "../../utils/MysticUtils/cooldownManager";
import { requireUserProfile } from "../../database/userInfo";
import { constants, text } from "../../providers/config";

export const command = new Command("drinkroulette", "Try your luck with drink roulette!")
	.setCategory("💲economy")
	.setExecutor(async (int) => {
		const userId = int.user.id;

		if (isOnCooldown(userId, "drinkroulette")) {
			const cooldownTime = getCooldownTimeRemaining(userId, "drinkroulette");
			await int.reply(
				format(
					text.errors.cooldown,
					pms(cooldownTime, { compact: true, secondsDecimalDigits: 1 })
				)
			);
			return;
		}

		const info = await requireUserProfile(userId, int);
		if (!info) return;

		const obtained = randRange(...constants.daily.amountRange); // Adjust if roulette uses different values
		setCooldown(userId, "drinkroulette");

		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { increment: obtained } },
		});

		await int.reply(
			format(sampleArray(text.commands.daily.responses), `\`$${obtained}\``)
		);
	});
