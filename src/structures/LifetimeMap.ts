import { z } from "zod";

const numberSchema = z.number();

/**
 * A map that deletes its entries after a certain amount of time.
 */
export class LifetimeMap<K, V> extends Map<K, V> {
	#timeoutMap = new Map<K, NodeJS.Timeout>();

	/**
	 * Creates a new LifetimeMap.
	 * @param lifetime The lifetime, in ms.
	 */
	constructor(
		public lifetime: number
	) {
		super();
		numberSchema.parse(lifetime);
	}

	/**
	 * Clears the map and cancels all timeouts.
	 */
	clear(): void {
		this.#timeoutMap.forEach(v => clearTimeout(v));
		this.#timeoutMap.clear();
		super.clear();
	}

	/**
	 * Deletes a key from the map and cancels the timeout.
	 * @param key The key to delete.
	 */
	delete(key: K): boolean {
		const timeout = this.#timeoutMap.get(key);
		if (timeout) clearTimeout(timeout);
		this.#timeoutMap.delete(key);
		return super.delete(key);
	}

	/**
	 * Sets a key-value pair in the map and sets a timeout to delete it.
	 * @param key The key to set.
	 * @param value The value to set.
	 */
	set(key: K, value: V): this {
		if (this.#timeoutMap.has(key)) {
			clearInterval(this.#timeoutMap.get(key)!);
			this.#timeoutMap.delete(key);
		}
		this.#timeoutMap.set(
			key,
			setTimeout(() => {
				this.delete(key);
			}, this.lifetime)
		);
		return super.set(key, value);
	}
}
