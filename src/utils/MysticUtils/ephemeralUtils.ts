/* eslint-disable @typescript-eslint/no-empty-function */
// utils/ephemeralUtils.ts
import type { Interaction} from "discord.js";
import { MessageFlags } from "discord.js";

export async function dismissEphemeral(interaction: Interaction) {
	if (!interaction.channel || !interaction.user) return;

	// Fetch the latest messages in the channel
	const messages = await interaction.channel.messages.fetch({ limit: 20 });

	// Filter ephemeral messages by the same user (sent via followUp)
	const userEphemerals = messages.filter(m =>
		m.interactionMetadata?.user?.id === interaction.user.id &&
        m.flags?.has(MessageFlags.Ephemeral)
	);

	for (const msg of userEphemerals.values()) {
		await msg.delete().catch(() => { });
	}
}
