import { OrderStatus } from "@prisma/client";
import { db } from "../../database/database";
import { generateOrderId, getClaimedOrder, getUserActiveOrder, hasActiveOrder, matchActiveOrder, matchOrderStatus, orderEmbedAsync } from "../../database/order";
import { getUserInfo } from "../../database/userInfo";
import { client } from "../../providers/client";
import { config, text } from "../../providers/config";
import { mainGuild } from "../../providers/discord";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("balance", "Checks your balance.")
	.setExecutor(async int => {
		const info = await getUserInfo(int.user);
		await int.reply(format(text.commands.balance.success, info?.balance ?? 0));
	});
