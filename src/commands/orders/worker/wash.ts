import {ChatInputCommandInteraction} from "discord.js";
import {PrismaClient} from "@prisma/client";
import {permissions} from "../../../providers/permissions";
import {Command} from "../../../structures/Command";
import {getUserBalance, updateBalance} from "../../../database/userInfo";

const prisma = new PrismaClient();

export const command = new Command('wash', 'Wash a dish.')
    .addAlias('clean')
    .addPermission(permissions.employee)
    .addOption("string", (o) => o
        .setRequired(true)
        .setName("wash")
        .setDescription(
            "The ID of the dish to wash."
        )
    )
    .addOption("boolean", (o) =>
        o.setName("inactive").setDescription("Include inactive orders too.")
    )
    .setExecutor(async (interaction: ChatInputCommandInteraction) => {
        const all = await prisma.dishes.findMany({ take: 10 });
        if (!all.length) {
            await interaction.reply("There are currently no dishes to wash.");
            return;
        }

        // Get the dish ID from the interaction options
        const dishId = interaction.options.getString('wash');
        if (!dishId) {
            await interaction.reply("You must specify a dish ID to wash.");
            return;
        }

        const dish = all.find(x => x.id === dishId);
        if (!dish) {
            await interaction.reply("That is not a valid dish.");
            return;
        }

        const time = Math.floor(Math.random() * 12) + 12;
        await interaction.reply(`Washing dish \`${dish.id}\`, this will take ${time} seconds.`);

        await prisma.dishes.delete({ where: { id: dish.id } });

        setTimeout(async () => {
            const userInfo = await getUserBalance(interaction.user);
            const donuts = userInfo.donuts + 60;
            await updateBalance(interaction.user, userInfo.balance, donuts);

            await interaction.followUp(`${interaction.user}, dish ${dish.id} has finished washing. You received 60 donuts.`);
        }, time * 1000);
    });