// TODO: discord has updated their typings, so this file is now broken, go cry about it
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

// todo: this is hell in a handbasket, fix it LATER.
// const cbComponent =
// 	<T extends MessageActionRowComponent>(
// 		component: Constructable<T> & (new () => T)
// 	) =>
// 		(cb: (ctx: CallbackContext<T>) => void) => {
// 			const id = `DB_CB__${component.name}_${Date.now()}`;
// 			const cmp = new component() as T;
// 			delete (cmp as Partial<ButtonBuilder>).setCustomId;
// 			componentCallbacks.set(id, ((int: InteractionByType) => cb(new CallbackContext(int as InteractionByType<T>, cmp))));
// 			return cmp;
// 		};
//
// export const cbButton = cbComponent(ButtonBuilder);
// export const cbSelectMenu = cbComponent(StringSelectMenuBuilder);
// export const actionRowOf = (...args: Parameters<ActionRowBuilder["addComponents"]>) =>
// 	new ActionRowBuilder().addComponents(...args);
