// @ts-ignore todo: this file isn't being used, so ts-ignore until it is
/* eslint-disable indent */
import * as fs from "fs";

interface GuildConfig {
    orderChannelId?: string;
}

export class ServerConfig {
    private static readonly configFile = "config.json";
	private config: ServerConfig | null;
	private guilds: {
		[guildId: string]: GuildConfig;
	} = {};

    constructor() {
        this.config = this.loadConfig();
    }

	private loadConfig(): ServerConfig | null {
        try {
            const data = fs.readFileSync(ServerConfig.configFile, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            console.error("Error loading config file:", error);
			return null;
        }
    }

    public getOrderChannel(guildId: string): string | undefined {
		return this.config?.guilds[guildId]?.orderChannelId;
    }

    public setOrderChannel(guildId: string, channelId: string): void {
		if (!this.config?.guilds[guildId]) {
			if (!this.config) return;
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