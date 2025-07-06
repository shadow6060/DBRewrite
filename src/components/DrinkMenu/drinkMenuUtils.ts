import type { ButtonInteraction } from "discord.js";

export async function safeDeferUpdate(interaction: ButtonInteraction) {
	if (interaction.deferred || interaction.replied) return;
	try { await interaction.deferUpdate(); } catch { /* empty */ }
}

export async function safeFollowUp(interaction: ButtonInteraction, data: Parameters<ButtonInteraction["followUp"]>[0]) {
	try { await interaction.followUp(data); } catch { /* empty */ }
}

export function setCooldown(buttonCooldown: Set<string>, userId: string, durationMs: number) {
	buttonCooldown.add(userId);
	setTimeout(() => buttonCooldown.delete(userId), durationMs);
}
