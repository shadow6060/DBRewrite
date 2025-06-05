import { db } from "../../database/database";

const SETTINGS_ID = "global"; // You can name it anything consistent

export const isManualMode = async (): Promise<boolean> => {
	const settings = await db.settings.findUnique({
		where: { id: SETTINGS_ID },
	});
	return settings?.manualModeEnabled ?? false;
};

export const setManualMode = async (enabled: boolean) => {
	await db.settings.upsert({
		where: { id: SETTINGS_ID },
		update: { manualModeEnabled: enabled },
		create: { id: SETTINGS_ID, manualModeEnabled: enabled },
	});
};
 