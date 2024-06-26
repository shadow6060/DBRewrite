/* eslint-disable indent */
import { Command } from "../structures/Command";
import { permissions } from "../providers/permissions";
import { CommandInteraction } from "discord.js";

export const customCommands = {
    enableXpCommand: new Command("enablexp", "Enable XP/levels in a channel.")
        .addPermission(permissions.employee)
        .setExecutor(async (int: CommandInteraction) => {
            // Command logic...
        }),

    disableXpCommand: new Command("disablexp", "Disable XP/levels in a channel.")
        .addPermission(permissions.employee)
        .setExecutor(async (int: CommandInteraction) => {
            // Command logic...
        }),

    enableLevelNotificationsCommand: new Command("enablelevelnotifications", "Enable level notifications in a channel.")
        .addPermission(permissions.employee)
        .setExecutor(async (int: CommandInteraction) => {
            // Command logic...
        }),

    disableLevelNotificationsCommand: new Command("disablelevelnotifications", "Disable level notifications.")
        .addPermission(permissions.employee)
        .setExecutor(async (int: CommandInteraction) => {
            // Command logic...
        }),
};
