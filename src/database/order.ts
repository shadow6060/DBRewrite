import type { Order } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
import type { User, UserResolvable, AnyChannel } from "discord.js";
import { MessageEmbed, Channel, GuildChannel } from "discord.js";
import { client } from "../providers/client";
import { text } from "../providers/config";
import { resolveUserId } from "../utils/id";
import { format } from "../utils/string";
import { db } from "./database";

export const activeOrderStatus = [
	OrderStatus.Unprepared,
	OrderStatus.Preparing,
	OrderStatus.Brewing,
	OrderStatus.Fermenting,
	OrderStatus.PendingDelivery,
	OrderStatus.Delivering,
];

export const hasActiveOrder = async (user: UserResolvable) =>
	(await db.order.count({
		where: {
			user: resolveUserId(user),
			status: { in: activeOrderStatus },
		},
	})) > 0;

export const getUserActiveOrder = async (user: UserResolvable) =>
	await db.order.findFirst({
		where: {
			user: resolveUserId(user),
			status: { in: activeOrderStatus },
		},
	});

export const orderExists = async (id: string) =>
	(await db.order.count({
		where: {
			id,
		},
	})) > 0;

const orderIdChars = "abcdefghijklmnopqrstuvwxyz1234567890".split("");

export const generateOrderId = async () => {
	for (let i = 0; i < 1000; i++) {
		const generated = [...Array(7)].map(() => orderIdChars[Math.floor(Math.random() * orderIdChars.length)]).join("");
		if (!(await orderExists(generated))) return generated;
	}
	throw new Error("This error should never appear. If it does, please buy a lottery ticket.");
};

export const getAllActiveOrders = async () => db.order.findMany({ where: { status: { in: activeOrderStatus } } });

export const matchOrderStatus = async (id: string, status: OrderStatus) =>
	db.order.findFirst({ where: { id: { startsWith: id }, status } });

export const matchActiveOrder = async (id: string) =>
	db.order.findFirst({ where: { id: { startsWith: id.toLowerCase() }, status: { in: activeOrderStatus } } });

export const getClaimedOrder = async (user: UserResolvable) =>
	db.order.findFirst({ where: { claimer: resolveUserId(user), status: OrderStatus.Preparing } });

export const getOrder = async (id: string) =>
	db.order.findFirst({ where: { id } });

export const getLatestOrder = async (user: UserResolvable) =>
	db.order.findFirst({ where: { user: resolveUserId(user), status: OrderStatus.Delivered }, orderBy: { createdAt: "desc" } });

const embedText = text.common.orderEmbed;

const rawOrderEmbed = (order: Order) =>
	new MessageEmbed()
		.setTitle(format(embedText.title, order.id))
		.setDescription(format(embedText.description, order.id))
		.addField(embedText.fields.id, `\`${order.id}\``, true)
		.addField(embedText.fields.details, `${order.details}`, true)
		.addField(embedText.fields.status, `${text.statuses[order.status] ?? order.status}`, true)
		.addField(
			embedText.fields.orderedAt,
			`<t:${Math.floor(order.createdAt.getTime() / 1000)}:T> (<t:${Math.floor(order.createdAt.getTime() / 1000)}:R>)`
		)
		.setTimestamp();

const formatIdentified = (identified: { id: string; name: string } | string) =>
	format(text.common.identified, typeof identified === "string" ? { id: identified, name: "Unknown" } : identified);
const formatUser = (user: User | string) =>
	formatIdentified(typeof user === "string" ? user : { name: user.username, id: user.id });
const formatChannel = (channel: AnyChannel | string) =>
	formatIdentified(
		channel instanceof GuildChannel
			? { name: `#${channel.name}`, id: channel.id }
			: typeof channel === "string"
				? channel
				: channel.id
	);

export const orderEmbedSync = (order: Order) => {
	const embed = rawOrderEmbed(order)
		.addField(embedText.fields.customer, formatUser(client.users.cache.get(order.user) ?? order.user), true)
		.addField(embedText.fields.channel, formatChannel(client.channels.cache.get(order.channel) ?? order.channel), true)
		.addField(embedText.fields.guild, formatIdentified(client.guilds.cache.get(order.guild) ?? order.guild), true);
	if (order.claimer)
		embed.addField(embedText.fields.claimer, formatUser(client.users.cache.get(order.claimer) ?? order.claimer), true);
	return embed;
};

const nulli = () => null;

export const orderEmbedAsync = async (order: Order) => {
	const embed = rawOrderEmbed(order)
		.addField(
			embedText.fields.customer,
			formatUser((await client.users.fetch(order.user).catch(nulli)) ?? order.user),
			true
		)
		.addField(
			embedText.fields.channel,
			formatChannel((await client.channels.fetch(order.channel).catch(nulli)) ?? order.channel),
			true
		)
		.addField(
			embedText.fields.guild,
			formatIdentified((await client.guilds.fetch(order.guild).catch(nulli)) ?? order.guild),
			true
		);
	if (order.claimer)
		embed.addField(
			embedText.fields.claimer,
			formatUser((await client.users.fetch(order.claimer).catch(nulli)) ?? order.claimer),
			true
		);
	return embed;
};

export const requiredOrderPlaceholders = ["mention", "image"];

export const orderPlaceholders = async(order: Order) => Object.assign(Object.create(null), {
	preparer: order.claimer ? formatUser((await client.users.fetch(order.claimer).catch(nulli)) ?? order.claimer) : "Unknown",
	deliverer: order.deliverer ? formatUser((await client.users.fetch(order.deliverer).catch(nulli)) ?? order.deliverer) : "Unknown",
	id: order.id,
	details: order.details,
	mention: `<@${order.user}>`,
	user: formatUser((await client.users.fetch(order.user).catch(nulli)) ?? order.user),
	image: order.image ?? "No image was found, this is very bad."
});

export const OrderFlags = {
	FeedbackGiven: 0b1,
	Tipped: 0b10,
};