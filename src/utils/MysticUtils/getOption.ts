// utils/getOption.ts
import type { CommandInteractionOptionResolver } from "discord.js";

export const getString = (
	options: CommandInteractionOptionResolver,
	name: string,
	required = false
): string => {
	const val = options.getString(name, required);
	if (required && !val) throw new Error(`Missing required option: ${name}`);
	return val!;
};
