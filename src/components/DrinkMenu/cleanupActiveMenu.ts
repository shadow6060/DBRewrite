import type { TextChannel } from "discord.js";
import { activeMenus } from "./drinkPageHandler";

export async function cleanupActiveMenu(userId: string, channel?: TextChannel | null) {
	if (!activeMenus.has(userId) || !channel) return;

	const messageId = activeMenus.get(userId);
	if (!messageId) return;

	try {
		const oldMessage = await channel.messages.fetch(messageId).catch(() => null);
		if (oldMessage) {
			await oldMessage.delete().catch(() => {/*noop*/ });
		}
	} catch {
		// Optional: console.warn("Cleanup failed, but it's okay.");
	} finally {
		activeMenus.delete(userId);
	}
}
