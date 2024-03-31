import type { ButtonInteraction, MessageActionRowComponent, MessageComponentInteraction, SelectMenuInteraction } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } from "discord.js";
import { componentCallbacks } from "../events/interactionCreate";
import {IllegalStateError} from "./error";

export type InteractionByType<C extends MessageActionRowComponent = MessageActionRowComponent> = C extends ButtonBuilder
	? ButtonInteraction<"cached">
	: C extends StringSelectMenuBuilder
	? SelectMenuInteraction<"cached">
	: MessageComponentInteraction<"cached">;

export class CallbackContext<T extends MessageActionRowComponent> {
	constructor(
		public readonly interaction: InteractionByType<T>,
		public readonly component: T,
	) {}
	get int() { return this.interaction; }
	get cmp() { return this.component; }

	async disable() {
		return this.#disableComponents(true, c => c.customId === this.component.customId);
	}
	async disableAll() {
		return this.#disableComponents(true);
	}
	async enable() {
		return this.#disableComponents(false, c => c.customId === this.component.customId);
	}
	async enableAll() {
		return this.#disableComponents(false);
	}

	/**
	 * it no work
	 */
	async #disableComponents(disabled: boolean, filter?: (cmp: MessageActionRowComponent) => boolean) {
		throw new IllegalStateError("This method is currently broken because v14 is making me sad, please use the `disable` and `enable` methods instead.");
		// return this.#walkComponents(x => (filter === undefined || filter(x)) && x.setDisabled(disabled));
	}
	async #walkComponents(map: (cmp: MessageActionRowComponent) => void) {
		this.int.message.components.forEach(x => x.components.forEach(map));
		
		return this.int.update({ components: this.int.message.components });
	}
}