import { IllegalStateError } from "./error";

const notInitializedSymbol = Symbol("notInitialized");
/**
 * Creates a value that throws an error when used.
 * @param identifier The identifier of the value, used in the error message.
 * @returns A value that throws an error when used.
 */
export const notInitialized = <T>(identifier?: string) => {
	const err = () => {
		throw new IllegalStateError(
			`Value '${identifier}' was used before it was defined.`
		);
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

/**
 * Checks if a value is not initialized.
 * @param v - The value to check.
 * @returns True if the value is not initialized, false otherwise.
 */
export const isNotInitialized = (v: unknown) =>
	(v as Record<typeof notInitializedSymbol, boolean | undefined>)[
		notInitializedSymbol
	] === true;

/**
 * Returns an array of typed key-value pairs from an object.
 *
 * @template T - The type of the object.
 * @param obj - The object to extract key-value pairs from.
 * @returns An array of typed key-value pairs from the object.
 */
export const typedEntries = <T extends object>(obj: T) =>
	Object.entries(obj) as {
		[K in keyof T]: [K, T[K]];
	}[keyof T][];

/**
 * Converts an array of key-value pairs into an object with typed keys.
 * @param arr - The array of key-value pairs.
 * @returns An object with typed keys.
 */
export const typedFromEntries = <K extends string | number | symbol, V>(
	arr: readonly (readonly [K, V])[]
) => Object.fromEntries(arr) as { [k in K]: V };

/**
 * Returns an array of keys from an object.
 * @param obj - The object from which to extract the keys.
 * @returns An array of keys from the object.
 */
export const typedKeys = <T extends object>(obj: T) =>
	Object.keys(obj) as (keyof T)[];

/**
 * Returns a random element from the given array.
 * @template T The type of elements in the array.
 * @param arr The array from which to select a random element.
 * @returns A random element from the array.
 */
export const sampleArray = <T>(arr: T[]) =>
	arr[Math.floor(Math.random() * arr.length)];

/**
 * Generates a random number within the specified range.
 * @param lowerInclusive - The lower bound of the range (inclusive).
 * @param upperExclusive - The upper bound of the range (exclusive).
 * @returns A random number within the specified range.
 */
export const randRange = (lowerInclusive: number, upperExclusive: number) =>
	lowerInclusive +
	Math.floor(Math.random() * (upperExclusive - lowerInclusive));
