import { MessageEmbed } from "discord.js";
import { db } from "../../database/database";
import { generateOrderId, getLatestOrder, hasActiveOrder, OrderFlags } from "../../database/order";
import { getUserInfo } from "../../database/userInfo";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";

export const command = new Command("give", "Give someone some money.")
	.addOption("integer", o => o.setName("money").setDescription("The amount to give.").setRequired(true))
    .addOption("string", o => o.setName("receiver ").setDescription("Please use their id").setRequired(true))
	.setExecutor(async int => {
		const user = int.user;
		const tip = int.options.getInteger("money", true);
        const receiver = int.options.getString("receiver", true);
		const info = await getUserInfo(int.user);
		if (!info || info.balance < tip) {
			await int.reply(text.common.notEnoughBalance);
			return;
		}
        if (tip > 5000) return int.reply("Funny this safety thing stopping your transaction of 5000+");
        await db.userInfo.update({
			where: { id: int.user.id },
			data: { balance: { decrement: tip } }
		});
        await db.userInfo.update({
			where: { id: receiver },
			data: { balance: { increment: tip } }
		});        

        int.reply(`You sucessfully transfered ${tip} to <@${receiver}>`)

	});
