import { Command } from "../../structures/Command";
import { db } from "../../database/database";
import { MessageFlags } from "discord.js";

export const command = new Command("createprofile", "Creates your economy profile.")
	.setCategory("💲economy")
	.setExecutor(async (int) => {
		const existing = await db.userInfo.findUnique({
			where: { id: int.user.id },
		});

		if (existing && existing.profileCreated) {
			await int.reply({
				content: "📝 You already have a profile!",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await db.userInfo.upsert({
			where: { id: int.user.id },
			update: {
				profileCreated: true,
				profileCreationDate: new Date(),
			},
			create: {
				id: int.user.id,
				balance: 0,
				donuts: 0,
				profileCreated: true,
				profileCreationDate: new Date(),
			},
		});

		await int.reply({
			content: "✅ Your profile has been created! You’re ready to earn currency.",
			flags: MessageFlags.Ephemeral,
		});
	});
