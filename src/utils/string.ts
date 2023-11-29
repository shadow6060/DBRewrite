// shut up eslint
/* eslint-disable indent */
import type {A, L, N, S} from "ts-toolbelt";
import {mainEmojis} from "../providers/discord";

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
export const capitalize = <T extends string>(str?: T) =>
	str ? ((str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>) : str;

/**
 * Represents a string with positional placeholders.
 * In the form of `<some string><{} * T><some string>`.
 */
export type PositionalFormattable<T extends number = 1> = `${string}${S.Join<
	L.Repeat<"{}", T>,
	string
>}${string}`;

/**
 * Represents a string with named placeholders.
 * In the form of `<some string><{key} * T><some string>`.
 * For each item in T, `{key}` will either be surrounded by `{}` or not.
 */
export type NamedFormattable<T extends string[]> = `${string}${S.Join<
	{ [k in keyof T]: T[k] extends string ? `{${T[k]}}` : never },
	string
>}${string}`;

/**
 * Extracts the placeholders from a string.
 * Utilizes recursion to extract all placeholders.
 */
type ExtractPlaceholders<
	T extends string,
	A extends string[] = []
> = T extends ""
	? A // return A if T is empty
	: S.Replace<T, "{}", ""> extends `${string}{${infer U}}${infer R}` // if T contains a placeholder
		? ExtractPlaceholders<R, [...A, U]> // recurse with the placeholder added to A
		: A; // return A if T does not contain a placeholder

/**
 * Counts the occurrences of a substring in a string.
 */
type CountStr<T extends string, S extends string> = N.Sub<
	S.Split<T, S>["length"],
	1
>;

/**
 * Represents a placeholder in a formatted string.
 */
type Placeholder = string | number;

/**
 * Represents the arguments for formatting a string.
 */
type FormatArguments<T extends string> = A.Equals<T, string> extends 1 // if T is a string
	? Placeholder[] | Record<string, Placeholder>[] // return an array of placeholders or an array of records
	: N.Greater<CountStr<T, "{}">, 0> extends 1 // if T contains a non-named placeholder ({}), but not a named placeholder ({key})
		? L.Repeat<Placeholder, CountStr<T, "{}">> // return an array of placeholders
		: N.Greater<CountStr<T, `{${string}}`>, 0> extends 1 // if T contains a named placeholder ({key})
			? [Record<ExtractPlaceholders<T>[number], Placeholder>] // return the extracted placeholders as a record
			: string[] | [Record<string, Placeholder>]; // return an array of strings or a record

/**
 * Formats a string by replacing placeholders with provided values.
 *
 * @param str - The string to format.
 * @param arr - The values to replace the placeholders with.
 * @returns The formatted string.
 */
export const format = <T extends string>(
	str: T,
	...arr: FormatArguments<T>
): string =>
	str.includes("{}")
		? str
			.split("{}")
			.reduce(
				(l, c, i, a) =>
					l + c + (i + 1 === a.length ? "" : arr[i] ?? "{}"),
				""
			)
		: /\{\w+\}/.test(str)
			? str.replaceAll(
				/\{(\w+)\}/g,
				(_, k) => (arr[0] as Record<string, string>)[k]
			)
			: str;

/**
 * Parses a text by replacing emoji placeholders with their corresponding emoji strings.
 *
 * @param str - The text to parse.
 * @returns The parsed text.
 */
export const parseText = (str: string) =>
	str.replaceAll(/\[(\w+)\]/g, (_, key) => mainEmojis[key]?.toString() ?? _);
