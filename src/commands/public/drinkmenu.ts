import { Command } from "../../structures/Command";
import { hasActiveOrder } from "../../database/orders";
import { db } from "../../database/database";
import { handleCategorySelection } from "../../components/DrinkMenu/categoryHandler";
import { activeMenus } from "../../components/DrinkMenu/state";

export const command = new Command("menuorder", "Order via menu interface.")
	.setCategory("📮order")
	.setExecutor(async (int) => {
		if (await hasActiveOrder(int.user)) {
			await int.reply({ content: "❌ You already have an active order.", flags: 64 });
			return;
		}

		if (activeMenus.has(int.user.id)) {
			await int.reply({
				content: "❌ You already have an open menu. Please finish or wait before opening a new one.",
				flags: 64,
			});
			return;
		}

		const allDrinks = await db.drinkImage.findMany();
		const categories = [...new Set(allDrinks.map(d => d.category))];
		const interactionUserId = int.user.id;

		await handleCategorySelection(int, categories, interactionUserId);
	});
