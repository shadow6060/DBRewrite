import { OrderStatus } from "@prisma/client";
import { db } from "../../database/database";
import {
	generateOrderId,
	getClaimedOrder,
	getUserActiveOrder,
	hasActiveOrder,
	matchActiveOrder,
	matchOrderStatus,
	orderEmbedAsync,
} from "../../database/order";
import { getUserInfo, upsertUserInfo } from "../../database/userInfo";
import { client } from "../../providers/client";
import { config, constants, text } from "../../providers/config";
import { mainGuild } from "../../providers/discord";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import pms from "pretty-ms";
import { randRange, sampleArray } from "../../utils/utils";
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
          ] 
        let awnser = result[Math.floor(Math.random() * result.length)];
        if (awnser === "Failure") {
        const info = await upsertUserInfo(int.user);
        const obtained = randRange(...constants.crime.amountRange);
        cooldowns[int.user.id] = Date.now() + constants.crime.cooldownMs;
        await db.userInfo.update({ where: { id: info.id }, data: { balance: { increment: -obtained } } });
        await int.reply(format(sampleArray(text.commands.crime.failure), `\`$${-obtained}\``));
        } else {
		const info = await upsertUserInfo(int.user);
		const obtained = randRange(...constants.crime.amountRange);
		cooldowns[int.user.id] = Date.now() + constants.crime.cooldownMs;
		await db.userInfo.update({ where: { id: info.id }, data: { balance: { increment: obtained } } });
		await int.reply(format(sampleArray(text.commands.crime.sucess), `\`$${obtained}\``));
        }
	});
