import HJSON from "hjson";
import fs from "fs";
import path from "path";
import type { ZodRawShape } from "zod";
import { z } from "zod";
import type { NamedFormattable, PositionalFormattable } from "../utils/string";
import { formatZodError } from "../utils/zod";
import pc from "picocolors";
import { arraysSimilar } from "../utils/array";
import { IllegalStateError } from "../utils/error";
import { OrderStatus } from "@prisma/client";

export const snowflake = z.string().length(18).regex(/^\d+$/);
const pFormattable = <T extends number = 1>(n: T = 1 as T) =>
	z.string().refine(x => x.split("{}").length - 1 === n, {
		message: `Formattable must contain ${n} placeholders`,
	}) as z.ZodType<PositionalFormattable<T>>;
const nFormattable = <T extends string[]>(...keys: T) =>
	z.string().refine(
		x =>
			arraysSimilar(
				[...x.matchAll(/\{(\w+)\}/g)].map(x => x[1]),
				keys
			),
		{
			message: `Formattable must contain the placeholders ${keys.join(", ")}`,
		}
	) as z.ZodType<NamedFormattable<T>>;

const textSchema = z
	.object({
		bot: z.object({
			status: z.object({
				type: z.enum(["PLAYING", "STREAMING", "LISTENING", "WATCHING", "COMPETING"]),
				name: z.string(),
			}),
		}),
		statuses: z.record(
			z.union([z.never(), z.never(), ...Object.values(OrderStatus).map(x => z.literal(x))]).optional(),
			z.string()
		),
		common: z.object({
			invalidOrderId: z.string(),
			noActiveOrder: z.string(),
			noClaimedOrder: z.string(),
			identified: nFormattable("name", "id"),
			orderEmbed: z.object({
				title: pFormattable(),
				description: pFormattable(),
				fields: z.object({
					id: z.string(),
					details: z.string(),
					status: z.string(),
					customer: z.string(),
					channel: z.string(),
					guild: z.string(),
					claimer: z.string(),
					orderedAt: z.string()
				}),
			}),
		}),
		commands: z.object({
			order: z.object({
				success: nFormattable("details", "id"),
				exists: z.string(),
			}),
			list: z.object({
				title: z.string(),
				empty: z.string(),
				parts: z.object({
					id: pFormattable(),
					status: pFormattable(),
					details: pFormattable(),
					time: pFormattable(),
					claimedBy: pFormattable(),
					unclaimed: z.string(),
				}),
			}),
			claim: z.object({
				existing: z.string(),
				success: z.string(),
			}),
			cancel: z.object({
				success: z.string(),
			}),
			brew: z.object({
				invalidUrl: z.string(),
				success: z.string(),
			}),
			deliver: z.object({
				noMessage: z.string(),
				noChannel: z.string(),
				success: z.string(),
				default: z.string(),
			}),
			deliverymessage: z.object({
				get: z.string(),
				set: z.object({
					missing: z.string(),
					success: z.string(),
				}),
				placeholders: z.object({
					title: z.string(),
					format: z.string(),
					requiredFormat: z.string(),
					list: z.record(z.string(), z.string())
				})
			}),
		}),
		errors: z.object({
			unauthorized: pFormattable(),
			exception: z.string(),
		}),
	})
	.strict();

const configSchema = z
	.object({
		token: z.string(),
		mainServer: snowflake,
		developers: snowflake.array(),
		databaseUrl: z.string().url(),
		emojis: z.record(z.string(), snowflake),
		roles: z.object({
			employee: snowflake,
		}),
		channels: z.object({
			brewery: snowflake,
			delivery: snowflake,
		})
	})
	.strict();

const constantsSchema = z
	.object({
		interactionExpiryTimeMs: z.number(),
		brewTimeRangeMs: z.tuple([z.number(), z.number()])
	})
	.strict();

export const configFolder = path.join(__dirname, "../../config/");

export const parseHjson = <T>(schema: z.ZodType<T>, file: string) => {
	const sp = schema.safeParse(HJSON.parse(fs.readFileSync(path.join(configFolder, file), "utf-8")));
	if (sp.success) return sp.data;
	console.error(pc.bgRed(pc.yellow(`Issue(s) found when scanning config ${pc.white(pc.bold(file))}.`)));
	console.error(formatZodError(sp.error));
	throw new IllegalStateError(`${file} is invalid.`);
};

export const text = parseHjson(textSchema, "text.hjson");
export const config = parseHjson(configSchema, "config.hjson");
export const constants = parseHjson(constantsSchema, "constants.hjson");