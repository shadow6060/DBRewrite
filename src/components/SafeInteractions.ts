import type {
	ButtonInteraction,
	Interaction,
	InteractionReplyOptions,
	InteractionUpdateOptions
} from "discord.js";
import { DiscordAPIError, MessageFlags } from "discord.js";

export async function safeFollowUp(interaction: ButtonInteraction, data: InteractionReplyOptions) {
	try {
		if (!interaction.replied && !interaction.deferred) {
			await interaction.followUp(data);
		} else {
			await interaction.followUp({ ...data, flags: MessageFlags.Ephemeral });
		}
	} catch (error) {
		if (!(error instanceof DiscordAPIError && error.code === 10062)) {
			// console.error("safeFollowUp error:", error);
		}
	}
}

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
