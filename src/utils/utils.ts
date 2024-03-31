import { IllegalStateError } from "./error";

const notInitializedSymbol = Symbol("notInitialized");
export const notInitialized = <T>(identifier?: string) => {
	const err = () => {
		throw new IllegalStateError(`Value '${identifier}' was used before it was defined.`);
	};
	function val() {
		/* noop */
	}
	val.toString = () => `Uninitialized value '${identifier}'`;
	return new Proxy(val, {
		apply: err,
		construct: err,
		defineProperty: err,
		deleteProperty: err,
		get: (_, k) => k === notInitializedSymbol || err(),
		getOwnPropertyDescriptor: err,
		getPrototypeOf: err,
		has: err,
		isExtensible: err,
		ownKeys: err,
		preventExtensions: err,
		set: err,
		setPrototypeOf: err,
	}) as unknown as NonNullable<T>;
};

export const isNotInitialized = (v: unknown) =>
	(v as Record<typeof notInitializedSymbol, boolean | undefined>)[notInitializedSymbol] === true;

export const typedEntries = <T extends object>(obj: T) =>
	Object.entries(obj) as {
		[K in keyof T]: [K, T[K]];
	}[keyof T][];

export const typedFromEntries = <K extends string | number | symbol, V>(arr: readonly (readonly [K, V])[]) =>
	Object.fromEntries(arr) as { [k in K]: V };

export const typedKeys = <T extends object>(obj: T) => Object.keys(obj) as (keyof T)[];
export const sampleArray = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export const randRange = (lowerInclusive: number, upperExclusive: number) =>
	lowerInclusive + Math.floor(Math.random() * (upperExclusive - lowerInclusive));
