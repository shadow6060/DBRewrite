// @ts-nocheck
// todo: fix when this file is used.
/* eslint-disable indent */
import {PrismaClient} from "@prisma/client";
import {CommandInteraction} from "discord.js";
import {permissions} from "../../providers/permissions";
import {Command} from "../../structures/Command";

const prisma = new PrismaClient();

export const command = new Command("transfer", "Transfers data from the old schema to the new schema.")
    .addPermission(permissions.admin)
    .setExecutor(async (int: CommandInteraction) => {
        try {
            // Retrieve all the existing user data
            const usersData = await prisma.userInfo.findMany();

            //console.log(`Total user data count: ${usersData.length}`);

            // Transfer the data to the new schema
            for (const data of usersData) {
                const userId = data.id;
                const guildsXPData = data.guildsxp;

                //console.log(`Transferring data for user with ID: ${userId}`);

                const guildsXPDataObject = parseGuildsXPData(guildsXPData);

                //console.log(`GuildsXPDataObject: ${JSON.stringify(guildsXPDataObject)}`);

                for (const guildId in guildsXPDataObject) {
                    const { id } = guildsXPDataObject[guildId];

                    // console.log(`Transferring data for guild with ID: ${guildId}`);

                    // Create or update the guildsXP data in the new schema
                    await prisma.guildsXP.upsert({
                        where: { userId_guildId: { userId, guildId } },
                        create: {
                            guildId: guildId,
                            userName: "", // Set userName as empty string for now
                            level: guildsXPDataObject[guildId].level,
                            exp: guildsXPDataObject[guildId].xp,
                            user: { connect: { id: userId } },
                        },
                        update: {
                            userName: "", // Set userName as empty string for now
                            level: guildsXPDataObject[guildId].level,
                            exp: guildsXPDataObject[guildId].xp,
                        },
                    });

                    // console.log(`Data transferred for guild with ID: ${guildId}`);
                }

                // Update the guildsxp field to be empty
                await prisma.userInfo.update({
                    where: { id: userId },
                    data: { guildsxp: "{}" },
                });

                //console.log(`Data transferred for user with ID: ${userId}`);
            }

            await int.reply("Data transfer completed successfully.");
        } catch (error) {
            console.error("Error transferring data:", error);
            await int.reply("Error transferring data. Please check the logs for more information.");
        } finally {
            await prisma.$disconnect();
        }
    });

// Function to parse the guildsXPData string and handle potential errors
function parseGuildsXPData(guildsXPData: string | null): Record<string, { id: string; xp: number; level: number }> {
    try {
        if (guildsXPData === null) {
            // Handle the case where guildsXPData is null
            return {};
        }

        const parsedData = JSON.parse(guildsXPData);

        if (typeof parsedData === "object" && !Array.isArray(parsedData)) {
            return parsedData;
        }
    } catch (error) {
        console.error("Error parsing guildsXPData:", error);
    }

    return {};
}
