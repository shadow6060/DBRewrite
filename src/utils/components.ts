import type { ButtonInteraction, Constructable, MessageActionRowComponent, MessageComponentInteraction, SelectMenuInteraction } from "discord.js";
import { MessageActionRow, MessageButton, MessageSelectMenu } from "discord.js";
import { componentCallbacks } from "../events/interactionCreate";

export type InteractionByType<C extends MessageActionRowComponent = MessageActionRowComponent> = C extends MessageButton
	? ButtonInteraction<"cached">
	: C extends MessageSelectMenu
	? SelectMenuInteraction<"cached">
	: MessageComponentInteraction<"cached">;

export class CallbackContext<T extends MessageActionRowComponent> {
	constructor(
		public readonly interaction: InteractionByType<T>,
		public readonly component: T,
	) { }
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
	async #disableComponents(disabled: boolean, filter?: (cmp: MessageActionRowComponent) => boolean) {
		return this.#walkComponents(x => (filter === undefined || filter(x)) && x.setDisabled(disabled));
	}
	async #walkComponents(map: (cmp: MessageActionRowComponent) => void) {
		this.int.message.components.forEach(x => x.components.forEach(map));

		return this.int.update({ components: this.int.message.components });
	}
}

const cbComponent =
	<T extends MessageActionRowComponent>(
		component: Constructable<T> & (new () => T)
	) =>
		(cb: (ctx: CallbackContext<T>) => void) => {
			const id = `DB_CB__${component.name}_${Date.now()}`;
			const cmp = new component().setCustomId(id) as T;
			delete (cmp as Partial<MessageButton>).setCustomId;
			componentCallbacks.set(id, ((int: InteractionByType) => cb(new CallbackContext(int as InteractionByType<T>, cmp))));
			return cmp;
		};

export const cbButton = cbComponent(MessageButton);
export const cbSelectMenu = cbComponent(MessageSelectMenu);
export const actionRowOf = (...args: Parameters<MessageActionRow["addComponents"]>) =>
	new MessageActionRow().addComponents(...args);
