import type {
	ButtonInteraction,
	Interaction,
	InteractionReplyOptions,
	InteractionUpdateOptions,
} from "discord.js";
import {
	DiscordAPIError,
	MessageFlags,
	ChatInputCommandInteraction,
	MessageComponentInteraction,
} from "discord.js";

/**
 * Safely follows up to a button interaction, handling cases where it might already be replied or deferred.
 * Ensures the message is sent as ephemeral if necessary.
 */
export async function safeFollowUp(interaction: ButtonInteraction, data: InteractionReplyOptions) {
	try {
		if (!interaction.replied && !interaction.deferred) {
			await interaction.followUp(data);
		} else {
			await interaction.followUp({ ...data, flags: MessageFlags.Ephemeral });
		}
	} catch (error) {
		// Error code 10062 = "Unknown interaction" (usually due to expired/clicked too late)
		if (!(error instanceof DiscordAPIError && error.code === 10062)) {
			// console.error("safeFollowUp error:", error);
		}
	}
}

/**
 * Safely defers a button interaction update to keep it alive for further actions.
 */
export async function safeDeferUpdate(interaction: ButtonInteraction) {
	try {
		if (!interaction.deferred && !interaction.replied) {
			await interaction.deferUpdate();
		}
	} catch (error) {
		if (!(error instanceof DiscordAPIError && error.code === 10062)) {
			// console.error("safeDeferUpdate error:", error);
		}
	}
} 

/**
 * Safely replies to an interaction (slash command or similar).
 * Ignores unknown interaction errors.
 */
export async function safeReply(interaction: Interaction, data: InteractionReplyOptions) {
	try {
		if ("reply" in interaction) {
			await interaction.reply(data);
		}
	} catch (error) {
		if (!(error instanceof DiscordAPIError && error.code === 10062)) {
			// console.error("safeReply error:", error);
		}
	}
}

/**
 * Safely updates an interaction message (typically from a select menu or button).
 * Ignores unknown interaction errors.
 */
export async function safeUpdate(interaction: Interaction, data: InteractionUpdateOptions) {
	try {
		if ("update" in interaction) {
			await interaction.update(data);
		}
	} catch (error) {
		if (!(error instanceof DiscordAPIError && error.code === 10062)) {
			// console.error("safeUpdate error:", error);
		}
	}
}

/**
 * Optional: Checks if an interaction is still alive (not replied or deferred).
 * Use this to avoid "Unknown interaction" errors when dealing with delayed button clicks, etc.
 *
 * Can be used in any collector or handler to skip stale interactions.
 */
// export function ensureInteractionAlive(
// 	interaction: ChatInputCommandInteraction | MessageComponentInteraction
// ): boolean {
// 	return !interaction.replied && !interaction.deferred;
// }

/**
 * Alternative version of ensureInteractionAlive — less strict, more dynamic.
 * Uncomment if you prefer not to limit the function to specific interaction types.
 */
// export function ensureInteractionAlive(interaction: Interaction): boolean {
// 	if (
// 		"replied" in interaction &&
// 		"deferred" in interaction &&
// 		typeof interaction.replied === "boolean" &&
// 		typeof interaction.deferred === "boolean"
// 	) {
// 		return !interaction.replied && !interaction.deferred;
// 	}
// 	return false;
// }
