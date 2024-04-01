import { z } from "zod";

const numberSchema = z.number();

export class LifetimeMap<K, V> extends Map<K, V> {
	#timeoutMap = new Map<K, NodeJS.Timeout>();
	constructor(
		/** The lifetime, in ms. */
		public lifetime: number
	) {
		super();
		numberSchema.parse(lifetime);
	}

	clear(): void {
		this.#timeoutMap.forEach(v => clearTimeout(v));
		this.#timeoutMap.clear();
		super.clear();
	}
	delete(key: K): boolean {
		const timeout = this.#timeoutMap.get(key);
		if (timeout) clearTimeout(timeout);
		this.#timeoutMap.delete(key);
		return super.delete(key);
	}
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
