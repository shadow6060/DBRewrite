import HJSON from "hjson";
import fs from "fs";
import path from "path";
import { z } from "zod";
import type { NamedFormattable, PositionalFormattable } from "../utils/string";
import { formatZodError } from "../utils/zod";
import pc from "picocolors";
import { IllegalStateError } from "../utils/error";
import { OrderStatus } from "@prisma/client";
export const snowflake = z.union([
	z.string().length(18).regex(/^\d+$/),
	z.string().length(19).regex(/^\d+$/),
]);

const pFormattable = <T extends number = 1>(n: T = 1 as T) =>
	z.string().refine((x) => x.split("{}").length - 1 === n, {
		message: `Formattable must contain ${n} placeholders`,
	}) as z.ZodType<PositionalFormattable<T>>;

const nFormattable = <T extends string[]>(...keys: T) =>
	z.string().refine(
		(x) => {
			for (const key of keys) {
				if (!x.includes(`{${key}}`)) {
					return false;
				}
			}
			return true;
		},
		{
			message: `Formattable must contain ${keys.join(", ")}`,
		}
	) as z.ZodType<NamedFormattable<T>>;

const textSchema = z
	.object({
		bot: z.object({
			status: z.object({
				type: z.enum([
					"PLAYING",
					"STREAMING",
					"LISTENING",
					"WATCHING",
					"COMPETING",
				]),
				name: z.string(),
			}),
		}),
		statuses: z.record(
			z
				.union([
					z.never(),
					z.never(),
					...Object.values(OrderStatus).map((x) => z.literal(x)),
				])
				.optional(),
			z.string()
		),
		common: z.object({
			invalidOrderId: z.string(),
			noActiveOrder: z.string(),
			noClaimedOrder: z.string(),
			identified: nFormattable("name", "id"),
			noOrders: z.string(),
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
					orderedAt: z.string(),
				}),
			}),
			invalidNatural: z.string(),
			notEnoughBalance: z.string(),
			interactOwn: z.string(),
			mainGuildOnly: z.string(),
		}),
		commands: z.object({
			order: z.object({
				exists: z.string(),
				success: nFormattable("details", "id"),
				created: nFormattable("details", "duty", "id", "tag"),
				success1: nFormattable("details", "id"),
				success2: nFormattable("details", "id", "price"),
				success_tab: nFormattable("details", "id"),
				customOrderSuccess: nFormattable("customOrderDetails", "id"),
				customOrderSuccess1: nFormattable(
					"customOrderDetails",
					"id",
					"price"
				),
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
				success: nFormattable("id"),
			}),
			unclaim: z.object({
				success: nFormattable("id"),
				notClaimed: z.string(), // Add this line for the error message
			}),
			cancel: z.object({
				success: z.string(),
			}),
			brew: z.object({
				invalidUrl: z.string(),
				success: z.string(),
				ready: pFormattable(4),
			}),
			deliver: z.object({
				noMessage: z.string(),
				noChannel: z.string(),
				success: z.string(),
				default: z.string(),
				multiSuccess: z.string(),
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
					list: z.record(z.string(), z.string()),
				}),
			}),
			balance: z.object({
				success: pFormattable(),
				success1: pFormattable(),
			}),
			work: z.object({
				responses: z.array(pFormattable()),
			}),
			daily: z.object({
				responses: z.array(pFormattable()),
			}),
			crime: z.object({
				sucess: z.array(pFormattable()),
				failure: z.array(pFormattable()),
			}),
			feedback: z.object({
				success: pFormattable(),
				alreadyGiven: z.string(),
				embed: z.object({
					title: pFormattable(),
					footer: pFormattable(),
				}),
			}),
			tip: z.object({
				success: pFormattable(2),
				alreadyTipped: z.string(),
				embed: z.object({
					title: z.string(),
					description: pFormattable(4),
					footer: pFormattable(),
				}),
			}),
			duty: z.object({
				enabled: z.string(),
				disabled: z.string(),
			}),
			delete: z.object({
				success: z.string(),
				dm: z.string(),
				userDmDisabled: z.string(),
				dmFailed: z.string(),
				userNotFound: z.string(),
				successNoDm: z.string(),
			}),

			rate: z
				.object({
					success: z.string(),
					alreadyRated: z.string(),
					invalidRating: z.string(),
				})
				.passthrough(),

			drinkingr: z.object({
				drinks: z.array(pFormattable()),
			}),
			blacklist: z.object({
				success: z.string(),
				existing: z.string(),
				remove: z.object({
					success: z.string(),
					existing: z.string(),
				}),
			}),
		}),
		errors: z.object({
			unauthorized: pFormattable(),
			exception: z.string(),
			cooldown: pFormattable(),
			blacklisted: z.string(),
		}),
	})
	.strict();

const configSchema = z
	.object({
		token: z.string(),
		mainServer: snowflake,
		developers: snowflake.array(),
		dashboardUrl: z.string().url(),
		databaseUrl: z.string().url(),
		emojis: z.record(z.string(), snowflake),
		roles: z.object({
			employee: snowflake,
			duty: snowflake,
			moderator: snowflake,
			dutyd: snowflake,
			admin: snowflake,
		}),
		channels: z.object({
			brewery: snowflake,
			delivery: snowflake,
			feedback: snowflake,
			tips: snowflake,
		}),
		servers: z.object({
			extraServer: snowflake, // Add the extra server here
		}),
	})
	.strict();

const constantsSchema = z
	.object({
		interactionExpiryTimeMs: z.number(),
		bakeTimeRangeMs: z.tuple([z.number(), z.number()]),
		brewTimeRangeMs: z.tuple([z.number(), z.number()]),
		work: z.object({
			amountRange: z.tuple([z.number(), z.number()]),
			cooldownMs: z.number(),
		}),
		daily: z.object({
			amountRange: z.tuple([z.number(), z.number()]),
			cooldownMs: z.number(),
		}),
		crime: z.object({
			amountRange: z.tuple([z.number(), z.number()]),
			cooldownMs: z.number(),
		}),
	})
	.strict();

export const configFolder = path.join(__dirname, "../../config/");

export const parseHjson = <T>(schema: z.ZodType<T>, file: string) => {
	const sp = schema.safeParse(
		HJSON.parse(fs.readFileSync(path.join(configFolder, file), "utf-8"))
	);
	if (sp.success) return sp.data;
	console.error(
		pc.bgRed(
			pc.yellow(
				`Issue(s) found when scanning config ${pc.white(
					pc.bold(file)
				)}.`
			)
		)
	);
	console.error(formatZodError(sp.error));
	throw new IllegalStateError(`${file} is invalid.`);
};

export const text = parseHjson(textSchema, "text.hjson");
export const config = parseHjson(configSchema, "config.hjson");
export const constants = parseHjson(constantsSchema, "constants.hjson");
