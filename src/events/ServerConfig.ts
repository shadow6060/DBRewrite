/* eslint-disable indent */
import * as fs from "fs";

interface GuildConfig {
    orderChannelId?: string;
}


export interface ServerConfig {
    guilds: Record<string, GuildConfig>;
}

export class ServerConfig {
    private static readonly configFile = "config.json";
    private config: ServerConfig;

    constructor() {
        this.config = this.loadConfig();
    }

    private loadConfig(): ServerConfig {
        try {
            const data = fs.readFileSync(ServerConfig.configFile, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            console.error("Error loading config file:", error);
            return { guilds: {} } as ServerConfig; // todo: handle error cause this is not a valid config
        }
    }

    public getOrderChannel(guildId: string): string | undefined {
        return this.config.guilds[guildId]?.orderChannelId;
    }

    public setOrderChannel(guildId: string, channelId: string): void {
        if (!this.config.guilds[guildId]) {
            this.config.guilds[guildId] = {};
        }
        this.config.guilds[guildId].orderChannelId = channelId;
        this.saveConfig();
    }

    private saveConfig(): void {
        const configString = JSON.stringify(this.config, null, 2);
        fs.writeFileSync(ServerConfig.configFile, configString, "utf-8");
    }
}