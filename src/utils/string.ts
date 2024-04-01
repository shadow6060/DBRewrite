import type { L, A, N, S } from "ts-toolbelt";
import { mainEmojis } from "../providers/discord";

export const capitalize = <T extends string>(str: T) => (str[0].toUpperCase() + str.slice(1)) as Capitalize<T>;

export type PositionalFormattable<T extends number = 1> = `${string}${S.Join<L.Repeat<"{}", T>, string>}${string}`;
export type NamedFormattable<T extends string[]> = `${string}${S.Join<{ [k in keyof T]: T[k] extends string ? `{${T[k]}}` : never}, string>}${string}`;

type ExtractPlaceholders<T extends string, A extends string[] = []> = T extends ""
	? A
	: S.Replace<T, "{}", ""> extends `${string}{${infer U}}${infer R}`
	? ExtractPlaceholders<R, [...A, U]>
	: A;

type CountStr<T extends string, S extends string> = N.Sub<S.Split<T, S>["length"], 1>;
type Placeholder = string | number;
type FormatArguments<T extends string> = A.Equals<T, string> extends 1
	? Placeholder[] | Record<string, Placeholder>[]
	: N.Greater<CountStr<T, "{}">, 0> extends 1
	? L.Repeat<Placeholder, CountStr<T, "{}">>
	: N.Greater<CountStr<T, `{${string}}`>, 0> extends 1
	? [Record<ExtractPlaceholders<T>[number], Placeholder>]
	: string[] | [Record<string, Placeholder>];

export const format = <T extends string>(str: T, ...arr: FormatArguments<T>): string =>
	str.includes("{}")
		? str.split("{}").reduce((l, c, i, a) => l + c + (i + 1 === a.length ? "" : arr[i] ?? "{}"), "")
		: /\{\w+\}/.test(str)
			? str.replaceAll(/\{(\w+)\}/g, (_, k) => (arr[0] as Record<string, string>)[k])
			: str;

export const parseText = (str: string) => str.replaceAll(/\[(\w+)\]/g, (_, key) => mainEmojis[key]?.toString() ?? _);
