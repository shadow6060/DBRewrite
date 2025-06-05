import { OrderStatus, Orders, PrismaClient } from "@prisma/client";
import { Client, User, UserResolvable, Channel, EmbedBuilder, GuildChannel } from "discord.js";
import { resolveUserId } from "../utils/id";
import { client } from "../providers/client";
import { db } from "./database";
import { text } from "../providers/config";
import { format } from "../utils/string";

// Active order status values
export const activeOrderStatus = [
	OrderStatus.Unprepared,
	OrderStatus.Preparing,
	OrderStatus.Brewing,
	OrderStatus.Fermenting,
	OrderStatus.PendingDelivery,
	OrderStatus.Delivering,
	OrderStatus.Claimed,
];

// Order existence & retrieval
export const hasActiveOrder = async (user: UserResolvable) =>
	(await db.orders.count({
		where: {
			user: resolveUserId(user),
			status: { in: activeOrderStatus },
		},
	})) > 0;

export const getUserActiveOrder = async (user: UserResolvable) =>
	await db.orders.findFirst({
		where: {
			user: resolveUserId(user),
			status: { in: activeOrderStatus },
		},
	});

export const orderExists = async (id: string) =>
	(await db.orders.count({ where: { id } })) > 0;

export const getAllActiveOrders = async () =>
	db.orders.findMany({ where: { status: { in: activeOrderStatus } } });

export const matchOrderStatus = async (id: string, status: OrderStatus) =>
	db.orders.findFirst({ where: { id: { startsWith: id }, status } });

export const matchActiveOrder = async (id: string) =>
	db.orders.findFirst({ where: { id: { startsWith: id.toLowerCase() }, status: { in: activeOrderStatus } } });

export const getClaimedOrder = async (user: UserResolvable) =>
	db.orders.findFirst({ where: { claimer: resolveUserId(user), status: OrderStatus.Preparing } });

export const getOrder = async (id: string) =>
	db.orders.findFirst({ where: { id } });

export const getLatestOrder = async (user: UserResolvable) =>
	db.orders.findFirst({
		where: { user: resolveUserId(user), status: OrderStatus.Delivered },
		orderBy: { createdAt: "desc" },
	});

// Order ID generation
const orderIdChars = "abcdefghijklmnopqrstuvwxyz1234567890".split("");
export const generateOrderId = async () => {
	for (let i = 0; i < 1000; i++) {
		const generated = [...Array(7)].map(() => orderIdChars[Math.floor(Math.random() * orderIdChars.length)]).join("");
		if (!(await orderExists(generated))) return generated;
	}
	throw new Error("Too many collisions! Try again later or buy a lottery ticket.");
};

// Dish ID generation (if relevant)
const dishIdChars = "abcdefghijklmnopqrstuvwxyz1234567890".split("");
export const generateDishId = async () => {
	for (let i = 0; i < 1000; i++) {
		const generated = [...Array(7)].map(() => dishIdChars[Math.floor(Math.random() * dishIdChars.length)]).join("");
		if (!(await dishExists(generated))) return generated;
	}
	throw new Error("Failed to generate unique dish ID.");
};

const prisma = new PrismaClient(); // needed for dishExists
const dishExists = async (id: string) =>
	(await prisma.dishes.count({ where: { id } })) > 0;

// Order embed builders
const embedText = text.common.orderEmbed;
const embedFields = text.common.orderEmbed.fields;

const rawOrderEmbed = (order: Orders) =>
	new EmbedBuilder()
		.setTitle(format(embedText.title, order.id))
		.setDescription(format(embedText.description, order.id))
		.addFields({ name: embedFields.id, value: `\`${order.id}\``, inline: true })
		.addFields({ name: embedFields.details, value: order.details, inline: true })
		.addFields({ name: embedFields.status, value: text.statuses[order.status] ?? order.status, inline: true })
		.addFields({ name: embedFields.orderedAt, value: `<t:${Math.floor(order.createdAt.getTime() / 1000)}:T> (<t:${Math.floor(order.createdAt.getTime() / 1000)}:R>)`, inline: true })
		.setTimestamp();

const formatIdentified = (identified: { id: string; name: string } | string) =>
	format(text.common.identified, typeof identified === "string" ? { id: identified, name: "Unknown" } : identified);

const formatUser = (user: User | string) =>
	formatIdentified(typeof user === "string" ? user : { name: user.username, id: user.id });

const formatChannel = (channel: Channel | string) =>
	formatIdentified(
		channel instanceof GuildChannel
			? { name: `#${channel.name}`, id: channel.id }
			: typeof channel === "string"
				? channel
				: channel.id
	);

// Sync embed with client fetches
export const orderEmbedSync = async (order: Orders, client: Client) => {
	const embed = rawOrderEmbed(order)
		.addFields({ name: embedFields.customer, value: formatUser((await client.users.fetch(order.user).catch(() => null)) ?? order.user), inline: true })
		.addFields({ name: embedFields.channel, value: formatChannel((await client.channels.fetch(order.channel).catch(() => null)) ?? order.channel), inline: true })
		.addFields({ name: embedFields.guild, value: formatIdentified((await client.guilds.fetch(order.guild).catch(() => null)) ?? order.guild), inline: true });

	if (order.claimer)
		embed.addFields({ name: embedFields.claimer, value: formatUser((await client.users.fetch(order.claimer).catch(() => null)) ?? order.claimer), inline: true });

	return embed;
};

// Async version with better error isolation
const nulli = () => null;

export const orderEmbedAsync = async (order: Orders, client: Client<boolean>): Promise<EmbedBuilder> => {
	const user = await client.users.fetch(order.user).catch(() => null);
	const channel = await client.channels.fetch(order.channel).catch(() => null);
	const guild = await client.guilds.fetch(order.guild).catch(() => null);

	const embed = rawOrderEmbed(order)
		.addFields({ name: "Customer", value: formatUser(user ?? order.user), inline: true })
		.addFields({ name: "Channel", value: formatChannel(channel ?? order.channel), inline: true })
		.addFields({ name: "Guild", value: formatIdentified(guild ?? order.guild), inline: true });

	if (order.claimer) {
		const claimer = await client.users.fetch(order.claimer).catch(() => null);
		if (claimer) {
			embed.addFields({ name: "Claimer", value: formatUser(claimer), inline: true });
		}
	}

	return embed;
};

// Placeholder injection (for templating messages)
export const requiredOrderPlaceholders = ["mention", "image"];

export const orderPlaceholders = async (order: Orders) => Object.assign(Object.create(null), {
	preparer: order.claimer ? formatUser((await client.users.fetch(order.claimer).catch(nulli)) ?? order.claimer) : "Unknown",
	deliverer: order.deliverer ? formatUser((await client.users.fetch(order.deliverer).catch(nulli)) ?? order.deliverer) : "Unknown",
	id: order.id,
	details: order.details,
	mention: `<@${order.user}>`,
	user: formatUser((await client.users.fetch(order.user).catch(nulli)) ?? order.user),
	image: order.imageUrl ?? "No image was found, this is very bad."
});

// Order flags
export const OrderFlags = {
	FeedbackGiven: 0b1,
	Tipped: 0b10,
	Rated: 0b100,
};

export { OrderStatus };
