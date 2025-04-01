import { db } from "../../database/database";
import { upsertUserInfo, getUserInfo } from "../../database/userInfo";
import { constants, text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
import { isOnCooldown, getCooldownTimeRemaining, setCooldown } from "../../utils/cooldownManager";

export const command = new Command(
	"daily",
	"Get your daily income!"
)
	.setExecutor(async (int) => {
		// Check if the command is disabled
		const userId = int.user.id;

		// Check cooldown
		if (isOnCooldown(userId, "daily")) {
			const cooldownTime = getCooldownTimeRemaining(userId, "daily");
			await int.reply(
				format(
					text.errors.cooldown,
					pms(cooldownTime, { compact: true, secondsDecimalDigits: 1 })
				)
			);
			return;
		}

		// Ensure user exists in the database
		let info = await getUserInfo(userId);
		if (!info) {
			await db.userInfo.create({
				data: { id: userId, balance: 0, donuts: 0 }
			});
			info = (await getUserInfo(userId))!; // Ensure it's not null
		}

		// Calculate earnings
		const obtained = randRange(...constants.daily.amountRange);

		// Set cooldown
		setCooldown(userId, "daily");

		// Update balance
		await db.userInfo.update({
			where: { id: info.id },
			data: { balance: { increment: obtained } },
		});

		// Send response
		await int.reply(
			format(sampleArray(text.commands.daily.responses), `\`$${obtained}\``)
		);
	});
