import type {
	Interaction,
	ButtonInteraction,
	InteractionReplyOptions,
	InteractionUpdateOptions,
	Message,
} from "discord.js";
import { DiscordAPIError, MessageFlags } from "discord.js";

/**
 * Safely updates a component interaction message.
 */
export async function safeUpdate(
	interaction: Interaction,
	data: InteractionUpdateOptions
): Promise<Message<boolean> | null> {
	try {
		if (interaction.isMessageComponent()) {
			await interaction.update(data);
			return await interaction.fetchReply();
		}
	} catch (error) {
		if (error instanceof DiscordAPIError && (error.code === 10062 || error.code === 40060)) {
			return interaction.isMessageComponent() ? await interaction.fetchReply().catch(() => null) : null;
		}
		console.error("safeUpdate error:", error);
	}
	return null;
}

/**
 * Safely defers a component interaction update.
 */
export async function safeDeferUpdate(interaction: Interaction): Promise<void> {
	try {
		if (interaction.isMessageComponent() && !interaction.deferred && !interaction.replied) {
			await interaction.deferUpdate();
		}
	} catch (error) {
		if (!(error instanceof DiscordAPIError && (error.code === 10062 || error.code === 40060))) {
			console.error("safeDeferUpdate error:", error);
		}
	}
}

/**
 * Safely replies to any repliable interaction.
 */
export async function safeReply(
	interaction: Interaction,
	data: InteractionReplyOptions
): Promise<Message<boolean> | null> {
	try {
		if ("isRepliable" in interaction && interaction.isRepliable()) {
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply(data);
			} else {
				await interaction.followUp({ ...data, flags: MessageFlags.Ephemeral });
			}
			return await interaction.fetchReply();
		}
	} catch (error) {
		if (!(error instanceof DiscordAPIError && (error.code === 10062 || error.code === 40060))) {
			console.error("safeReply error:", error);
		}
	}
	return null;
}

/**
 * Safely follows up to a repliable interaction.
 */
export async function safeFollowUp(
	interaction: Interaction,
	data: InteractionReplyOptions
): Promise<Message<boolean> | null> {
	try {
		if ("isRepliable" in interaction && interaction.isRepliable()) {
			if (!interaction.replied && !interaction.deferred) {
				await interaction.followUp(data);
			} else {
				await interaction.followUp({ ...data, flags: MessageFlags.Ephemeral });
			}
			return await interaction.fetchReply();
		}
	} catch (error) {
		if (!(error instanceof DiscordAPIError && (error.code === 10062 || error.code === 40060))) {
			console.error("safeFollowUp error:", error);
		}
	}
	return null;
}

/**
 * Sets a cooldown for a user.
 */
export function setCooldown(buttonCooldown: Set<string>, userId: string, durationMs: number) {
	buttonCooldown.add(userId);
	setTimeout(() => buttonCooldown.delete(userId), durationMs);
}
