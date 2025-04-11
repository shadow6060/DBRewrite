/* eslint-disable linebreak-style */
import { db } from "../../database/database";
import { generateOrderId, hasActiveOrder } from "../../database/orders";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import { sampleArray } from "../../utils/utils";
import { OrderStatus } from "@prisma/client";

// In-memory store to avoid repeat drinks
const lastDrinkMap = new Map<string, string>(); // userId -> lastDrink

export const command = new Command("drinkroulette", "Get a random drink ordered!")
	.setExecutor(async int => {
		if (await hasActiveOrder(int.user)) {
			await int.reply(text.commands.order.exists);
			return;
		}

		// Extract and clean drink names from config
		const allConfiguredDrinks = text.commands.drinkingr.drinks.map(str =>
			str.replace(/[`{}]/g, "").toLowerCase()
		);

		// Fetch drinks that exist in the drinkImage table
		const drinkImages = await db.drinkImage.findMany({
			where: {
				drinkName: {
					in: allConfiguredDrinks,
				},
			},
			select: {
				drinkName: true,
				url: true,
			},
		});

		// Group image URLs by drink name
		const imagesByDrink: Record<string, string[]> = {};
		for (const entry of drinkImages) {
			if (!imagesByDrink[entry.drinkName]) {
				imagesByDrink[entry.drinkName] = [];
			}
			imagesByDrink[entry.drinkName].push(entry.url);
		}

		const availableDrinks = Object.keys(imagesByDrink);
		if (availableDrinks.length === 0) {
			await int.reply("Sorry! No available drinks with images right now.");
			return;
		}

		// Avoid repeating the last drink this user got
		const lastDrink = lastDrinkMap.get(int.user.id);
		let filteredDrinks = availableDrinks.filter(drink => drink !== lastDrink);
		if (filteredDrinks.length === 0) filteredDrinks = availableDrinks;

		const selectedDrink = sampleArray(filteredDrinks);
		const imageUrl = sampleArray(imagesByDrink[selectedDrink]);

		// Save the last drink used for this user
		lastDrinkMap.set(int.user.id, selectedDrink);

		// Create the order
		const order = await db.orders.create({
			data: {
				id: await generateOrderId(),
				user: int.user.id,
				details: selectedDrink,
				channel: int.channelId,
				guild: int.guildId,
				image: imageUrl,
				status: OrderStatus.Preparing,
			},
		});

		await int.reply(`🎲 You rolled **${order.details}**! It's being prepared now. 🍸`);
	});
