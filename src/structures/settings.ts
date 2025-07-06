import { db } from "../database/database";

// Checks if manual mode is ON
export const isManualMode = async (): Promise<boolean> => {
	const settings = await db.settings.findFirst({ where: { id: "global" } });
	return settings?.manualModeEnabled ?? false;
};

// Toggles manual mode ON or OFF
export const setManualMode = async (enabled: boolean): Promise<void> => {
	await db.settings.upsert({
		where: { id: "global" },
		update: { manualModeEnabled: enabled },
		create: { id: "global", manualModeEnabled: enabled },
	});
};
