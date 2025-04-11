/* eslint-disable indent */
import {permissions} from "../../providers/permissions";
import {getUserInfo, updateBalance} from "../../database/userInfo";
import {ExtendedCommand} from "../../structures/extendedCommand";
import {config} from "../../providers/config";

export const command = new ExtendedCommand({ name: "currencyedit", description: "Manage user balance.", servers: [config.servers.extraServer], local: true })
    .addPermission(permissions.developer)
    .addSubCommand((subcommand) =>
        subcommand
            .setName("set")
            .setDescription("Set user balance.")
            .addUserOption((option) =>
                option
                    .setName("user")
                    .setDescription("The user whose balance you want to set.")
                    .setRequired(true)
            )
            .addIntegerOption((option) =>
                option
                    .setName("amount")
                    .setDescription("The amount to set as the user's balance.")
                    .setRequired(true)
            )
    )
    .addSubCommand((subcommand) =>
        subcommand
            .setName("check")
            .setDescription("Check user balance.")
            .addUserOption((option) =>
                option
                    .setName("user")
                    .setDescription("The user whose balance you want to check.")
                    .setRequired(true)
            )
    )
    .setExecutor(async (int) => {
        const subcommand = int.options.getSubcommand(true);

        if (subcommand === "set") {
            const user = int.options.getUser("user", true);
            const amount = int.options.getInteger("amount", true);

            try {
                await updateBalance(user.id, amount, 0);
                await int.reply(`User ${user.username}'s balance has been set to ${amount}.`);
            } catch (error) {
                console.error("Error setting user balance:", error);
                await int.reply("An error occurred while setting user balance.");
            }
        } else if (subcommand === "check") {
            const user = int.options.getUser("user", true);

            try {
                const userInfo = await getUserInfo(user.id);
                if (userInfo) {
                    await int.reply(`User ${user.username}'s balance is ${userInfo.balance}.`);
                } else {
                    await int.reply("User balance not found.");
                }
            } catch (error) {
                console.error("Error checking user balance:", error);
                await int.reply("An error occurred while checking user balance.");
            }
        } else {
            await int.reply("This subcommand is not yet implemented.");
        }
    });
