import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { permissions } from "../../../providers/permissions";
import { Command } from "../../../structures/Command";

const prisma = new PrismaClient();

export const command = new Command('dishes', 'Get a list of all dirty dishes.')
    .addAlias('plates')
    .addShortcuts('dsh')
    .addPermission(permissions.employee)
    .setExecutor(async (interaction: CommandInteraction) => {
        const dishes = await prisma.dishes.findMany();
        const statuses = ['Filthy', 'Smells Weird', 'Literally Ancient', 'Mildly Dirty'];

        const embed = new EmbedBuilder()
            .setTitle('🍽 Dishes')
            .setFooter({ text: 'Run /wash [id] to wash a dish!' });

        if (dishes.length === 0) {
            embed.setDescription('No dishes to wash right now.');
        } else {
            for (const dish of dishes) {
                embed.addFields({ name: `Dish ID: ${dish.id}`, value: `Status: ${statuses[dish.status]}`, inline: true });
            }
        }

        await interaction.reply({ embeds: [embed] });
    });
