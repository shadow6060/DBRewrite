/* eslint-disable indent */
export const serverConfigSchema = {
    name: "ServerConfig",
    fields: {
        id: { type: "String", id: true },
        prefix: { type: "String" },
        welcomeMessageEnabled: { type: "Boolean" },
        welcomeMessageChannel: { type: "String", nullable: true },
        xpEnabledChannels: { type: "String[]", nullable: true },
        levelNotificationChannelId: { type: "String", nullable: true },
    },
};