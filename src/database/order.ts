import type { Order } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
import type { Client, User, UserResolvable, Channel } from "discord.js";
import { EmbedBuilder, GuildChannel } from "discord.js";
import { client } from "../providers/client";
import { text } from "../providers/config";
import { resolveUserId } from "../utils/id";
import { format } from "../utils/string";
import { db } from "./database";
import type { EmbedField } from "discord.js";
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
const embedFields = text.common.orderEmbed.fields;

const rawOrderEmbed = (order: Order) =>
	new EmbedBuilder()
		.setTitle(format(embedText.title, order.id))
		.setDescription(format(embedText.description, order.id))
		.addFields({ name: format(embedFields.id), value: `\`${order.id}\``, inline: true })
		.addFields({ name: embedFields.details, value: `${order.details}`, inline: true })
		.addFields({ name: embedFields.status, value: `${text.statuses[order.status] ?? order.status}`, inline: true })
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

export const orderEmbedSync = async (order: Order, client: Client) => {
	const embed = rawOrderEmbed(order)
		.addFields({ name: embedFields.customer, value: formatUser((await client.users.fetch(order.user).catch(() => null)) ?? order.user), inline: true })
		.addFields({ name: embedFields.channel, value: formatChannel((await client.channels.fetch(order.channel).catch(() => null)) ?? order.channel), inline: true })
		.addFields({ name: embedFields.guild, value: formatIdentified((await client.guilds.fetch(order.guild).catch(() => null)) ?? order.guild), inline: true });
	if (order.claimer)
		embed.addFields({ name: embedFields.claimer, value: formatUser((await client.users.fetch(order.claimer).catch(() => null)) ?? order.claimer), inline: true });
	return embed;
};

const nulli = () => null;

export const orderEmbedAsync = async (order: Order, client: Client<boolean>): Promise<EmbedBuilder> => {
	const user = await client.users.fetch(order.user).catch(() => null);
	const channel = await client.channels.fetch(order.channel).catch(() => null);
	const guild = await client.guilds.fetch(order.guild).catch(() => null);

	const embed = rawOrderEmbed(order)
		.addFields(
			{ name: "Customer", value: formatUser(user ?? order.user), inline: true }
		)
		.addFields(
			{ name: "Channel", value: formatChannel(channel ?? order.channel), inline: true }
		)
		.addFields(
			{ name: "Guild", value: formatIdentified(guild ?? order.guild), inline: true }
		);

	if (order.claimer) {
		const claimer = await client.users.fetch(order.claimer).catch(() => null);
		if (claimer) {
			embed.addFields(
				{ name: "Claimer", value: formatUser(claimer), inline: true }
			);
		}
	}

	return embed;
};
export const requiredOrderPlaceholders = ["mention", "image"];

export const orderPlaceholders = async (order: Order) => Object.assign(Object.create(null), {
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