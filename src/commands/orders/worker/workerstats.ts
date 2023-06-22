import { CommandInteraction, EmbedBuilder } from "discord.js";
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";
import { PrismaClient, Prisma } from '@prisma/client';
import { getWorkerInfo, getWorkerInfos } from "../../../database/workerInfo";

const prisma = new PrismaClient();

export const command = new Command("workerstats", "Checks the global worker stats.")
    .addSyntax("monthly", "text")
    .addPermission(permissions.employee)
    .addShortcuts("ws")
    .setExecutor(async (int: CommandInteraction) => {
        const args = int.options.getString("monthly")?.includes("m") ? ["monthly", ...int.options.getString("monthly").split(" ").slice(1)] : [];
        const workerInfos = await getWorkerInfos(); // Retrieve the workerInfos
        let data = workerInfos;
        let isMonthly = false;
        if (args[0] && args[0].includes("m")) {
            data = workerInfos;
            args.shift();
            isMonthly = true;
        }
        let sumc = data.reduce((acc, info) => acc + info.preparations, 0); // Calculate sum of cooks
        let sumd = data.reduce((acc, info) => acc + info.deliveries, 0); // Calculate sum of delivers
        let sum = sumc + sumd;
        let avgc = sumc / data.length; // Calculate average cooks
        let avgd = sumd / data.length; // Calculate average delivers
        let avg = avgc + avgd;
        const li = [sumc, sumd, sum, avgc, avgd, avg].map(item => {
            if (isNaN(item)) return 0;
            return item;
        });
        sumc = li[0];
        sumd = li[1];
        sum = li[2];
        avgc = li[3];
        avgd = li[4];
        const embed = new EmbedBuilder()
            .setTitle(`The Global ${isMonthly ? "Monthly " : ""}Worker Stats`)
            .addFields(
                { name: "Total preps", value: `${sumc} preps`, inline: true },
                { name: "Average preps", value: `${avgc} preps`, inline: true },
                { name: "Total deliveries", value: `${sumd} delivers`, inline: true },
                { name: "Average deliveries", value: `${avgd} deliveries`, inline: true },
                { name: "Total", value: `${sum} preps and deliveries`, inline: true },
                { name: "Average", value: `${avg} preps and deliveries`, inline: true }
            )
            .setThumbnail("https://images.emojiterra.com/twitter/512px/1f4ca.png");
        int.reply({ embeds: [embed] });
    });
