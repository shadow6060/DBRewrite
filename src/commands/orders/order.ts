import {
	CommandInteractionOptionResolver,
	EmbedBuilder,
	TextChannel,
	MessageFlags,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
} from "discord.js";
import { db } from "../../database/database";
import { generateOrderId, hasActiveOrder } from "../../database/orders";
import { text } from "../../providers/config";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
import { OrderStatus } from "@prisma/client";
import { isManualMode } from "../../utils/MysticUtils/settings";
import { mainChannels, mainRoles } from "../../providers/discord";
import { getUserBalance, updateBalance } from "../../database/userInfo";
import { getOrCreateTab, addToTab, isTabBlocked, getTabStatus } from "../../database/tab";

export const command = new Command("order", "Orders a drink.")
	.setCategory("📨order")
	.addOption("string", (o) =>
		o.setName("drink").setDescription("The drink to order.").setRequired(true)
	)
	.setExecutor(async (int) => {
		// Check if the user already has an active order
		if (await hasActiveOrder(int.user)) {
			await int.reply({ content: text.commands.order.exists, flags: MessageFlags.Ephemeral });
			return;
		}

		// Check if the system is in manual mode
		const manualMode = await isManualMode();
		const options = int.options as CommandInteractionOptionResolver;
		const drink = options.getString("drink", true).toLowerCase();

		// Retrieve all available drinks from the database
		const availableDrinks = await db.drinkImage.findMany({
			select: {
				drinkName: true,
				price: true,
				id: true // Include the image ID
			},
		});

		// Check if the ordered drink is valid
		const validDrinkNames = availableDrinks.map(d => d.drinkName.toLowerCase());
		if (!validDrinkNames.includes(drink)) {
			await int.reply({
				content: `Sorry, we don't serve **${drink}**. Please choose something from the menu.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		// Get the selected drink details
		const selectedDrink = availableDrinks.find(d => d.drinkName.toLowerCase() === drink);
		if (!selectedDrink || selectedDrink.price === null) {
			await int.reply({
				content: "Sorry, we couldn't retrieve the price for this drink.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		// Get user balance
		const userBalance = await getUserBalance(int.user.id);
		if (userBalance.balance < selectedDrink.price) {
			await int.reply({
				content: `You don't have enough currency to buy **${drink}**. Your current balance is **${userBalance.balance}** and the drink costs **${selectedDrink.price}**.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		// Handle manual mode and confirmation
		if (manualMode) {
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId("confirm_order")
					.setLabel("✅ Confirm")
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId("cancel_order")
					.setLabel("❌ Cancel")
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId("put_on_tab")
					.setLabel("💳 Put on Tab")
					.setStyle(ButtonStyle.Primary)
			);

			await int.reply({
				content: `The price for **${drink}** is **${selectedDrink.price}**. How would you like to proceed?`,
				components: [row],
				flags: MessageFlags.Ephemeral,
			});

			const confirmation = await int.channel?.awaitMessageComponent({
				componentType: ComponentType.Button,
				time: 15000,
				filter: (btn) => btn.user.id === int.user.id,
			}).catch(() => null);

			if (!confirmation || confirmation.customId === "cancel_order") {
				await int.editReply({
					content: "Order cancelled.",
					components: [],
				});
				return;
			}

			if (confirmation.customId === "confirm_order") {
				// Deduct balance if the order is confirmed
				await updateBalance(int.user.id, userBalance.balance - selectedDrink.price);

				const updatedBalance = userBalance.balance - selectedDrink.price;
				await confirmation.update({
					content: `✅ Confirmed! Your order for **${drink}** has been placed. You now have **${updatedBalance}** currency left.`,
					components: [],
				});
			} else if (confirmation.customId === "put_on_tab") {
				// Check if the user's tab is blocked or if they can add to tab
				const guildId = int.guildId!;
				const tabBlocked = await isTabBlocked(int.user.id, guildId);
				if (tabBlocked) {
					await confirmation.update({
						content: "❌ Your tab is currently blocked. Please pay your tab before adding more.",
						components: [],
					});
					return;
				}

				// Add the drink price to the user's tab
				await addToTab(int.user.id, guildId, selectedDrink.price);

				await confirmation.update({
					content: `💳 Added **${drink}** to your tab for **${selectedDrink.price}** currency. Remember to pay your tab later!`,
					components: [],
				});
			}
		}

		// Select a random image for the drink
		let selectedImage = null;
		const images = await db.drinkImage.findMany({
			where: { drinkName: drink },
			select: { id: true, url: true },
		});

		if (images.length > 0) {
			selectedImage = images[Math.floor(Math.random() * images.length)];
		}

		if (!selectedImage) {
			await int.editReply({
				content: "Sorry, we couldn't find an image for this drink.",
			});
			return;
		}

		// Create the order in the database
		const order = await db.orders.create({
			data: {
				id: await generateOrderId(),
				user: int.user.id,
				details: drink,
				channel: int.channelId,
				guild: int.guildId,
				status: manualMode ? OrderStatus.Unprepared : OrderStatus.Preparing,
				drinkImageId: selectedImage.id,
			},
		});

		// Handle brewery channel notification for manual mode
		if (manualMode) {
			const breweryChannel = mainChannels.brewery as TextChannel;
			const embed = new EmbedBuilder()
				.setTitle("📥 New Manual Order")
				.setDescription("A new drink order has been placed!")
				.addFields(
					{ name: "Customer", value: int.user.tag, inline: true },
					{ name: "Order ID", value: `\`${order.id}\``, inline: true },
					{ name: "Drink", value: drink, inline: false },
					{ name: "Status", value: OrderStatus.Unprepared, inline: true }
				)
				.setColor(0x8e44ad)
				.setTimestamp();

			await breweryChannel.send({
				content: `${mainRoles.duty}`,
				embeds: [embed],
			});
		}

		// Respond to the user based on the order status (only non-manual)
		if (!manualMode) {
			await int.reply({
				content: format(text.commands.order.success, {
					id: order.id,
					details: drink,
				}),
			});
		}
	});
