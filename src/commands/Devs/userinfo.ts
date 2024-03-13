/* eslint-disable indent */
import { db } from "../../database/database";
import { Command } from "../../structures/Command";

export const command = new Command("userinfo", "Show user information including ratings.")
    .setExecutor(async int => {
        const userId = int.user.id;
        const userOrders = await db.cafeOrders.findMany({
            where: {
                user: userId,
                bakeRating: { not: null },
                prepRating: { not: null },
                deliveryRating: { not: null }
            },
            select: {
                bakeRating: true,
                prepRating: true,
                deliveryRating: true
            }
        });

        if (userOrders.length === 0) {
            await int.reply("You have no ratings yet.");
            return;
        }

        let totalRatings = 0;
        let totalBakeRating = 0;
        let totalPrepRating = 0;
        let totalDeliveryRating = 0;

        for (const order of userOrders) {
            if (order.bakeRating && order.prepRating && order.deliveryRating) {
                totalRatings++;
                totalBakeRating += order.bakeRating;
                totalPrepRating += order.prepRating;
                totalDeliveryRating += order.deliveryRating;
            }
        }

        if (totalRatings === 0) {
            await int.reply("You have no ratings yet.");
            return;
        }

        const averageBakeRating = totalBakeRating / totalRatings;
        const averagePrepRating = totalPrepRating / totalRatings;
        const averageDeliveryRating = totalDeliveryRating / totalRatings;

        const bakeRatingStars = "⭐".repeat(Math.round(averageBakeRating));
        const prepRatingStars = "⭐".repeat(Math.round(averagePrepRating));
        const deliveryRatingStars = "⭐".repeat(Math.round(averageDeliveryRating));

        let response = `Your average bake rating: ${averageBakeRating.toFixed(1)} (${bakeRatingStars})\n`;
        response += `Your average prep rating: ${averagePrepRating.toFixed(1)} (${prepRatingStars})\n`;
        response += `Your average delivery rating: ${averageDeliveryRating.toFixed(1)} (${deliveryRatingStars})\n`;

        if (totalRatings > 0) {
            response += `Total ratings: ${totalRatings}`;
        }

        await int.reply(response);
    });
