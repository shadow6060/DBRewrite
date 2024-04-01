import type { GuildEmoji, TextBasedChannel } from "discord.js";
import { client } from "../providers/client";
import { loadCommands } from "../providers/commandManager";
import { config, text } from "../providers/config";
import { mainChannels, mainEmojis, mainGuild, setMainGuild, setMainRoles } from "../providers/discord";
import { startOrderTimeoutChecks } from "../providers/orderManager";
import { IllegalStateError } from "../utils/error";
import { parseText } from "../utils/string";
import { isNotInitialized, typedEntries, typedFromEntries } from "../utils/utils";

type TextObject = {
	[k: string]: string | string[] | TextObject;
};

client.on("ready", async () => {
	if (!client.isReady()) return;
	console.log(`Bot up as ${client.user.tag}!`);
	loadCommands();
	if (isNotInitialized(mainGuild)) setMainGuild(await client.guilds.fetch(config.mainServer));
	setMainRoles(
		typedFromEntries(
			await Promise.all(
				typedEntries(config.roles).map(async x => [
					x[0],
					(await mainGuild.roles.fetch(x[1])) ??
						(() => {
							throw new IllegalStateError(`Role ${x[0]} was not found.`);
						})(),
				])
			)
		)
	);
	for (const ch in mainChannels) {
		if (isNotInitialized(mainChannels[ch as keyof typeof mainChannels])) {
			const channel = await client.channels.fetch(config.channels[ch as keyof typeof config["channels"]]);
			if (!channel) throw new IllegalStateError(`Main channel ${ch}was not found.`);
			mainChannels[ch as keyof typeof mainChannels] = channel as TextBasedChannel;
		}
	}
	mainGuild.emojis.fetch();
	const emojis = Object.fromEntries(
		await Promise.all(Object.entries(config.emojis).map(async x => [x[0], await mainGuild.emojis.fetch(x[1])]))
	) as Record<string, GuildEmoji>;
	Object.assign(mainEmojis, emojis);
	const parseTexts = (texts: TextObject) => {
		for (const k in texts) {
			if (typeof texts[k] === "string") texts[k] = parseText(texts[k] as string);
			else if (typeof texts[k] === "object") parseTexts(texts[k] as TextObject);
		}
	};
	parseTexts(text.commands);
	parseTexts(text.errors);
	parseTexts(text.common);
	startOrderTimeoutChecks();
});
