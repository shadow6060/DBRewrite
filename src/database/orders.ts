import { OrderStatus, Orders } from "@prisma/client";
import { resolveUserId } from "../utils/id";
import { db } from "./database";
import { UserResolvable } from "discord.js";

// Define active order statuses
export const activeOrderStatus = [
	OrderStatus.Unprepared,
	OrderStatus.Preparing,
	OrderStatus.Brewing,
	OrderStatus.Fermenting,
	OrderStatus.PendingDelivery,
	OrderStatus.Delivering,
	OrderStatus.Claimed,
];

// Utility function to check if a user has an active order
export const hasActiveOrder = async (user: UserResolvable) =>
	(await db.orders.count({
		where: {
			user: resolveUserId(user),
			status: { in: activeOrderStatus },
		},
	})) > 0;

// Get the active order for a user
export const getUserActiveOrder = async (user: UserResolvable) =>
	await db.orders.findFirst({
		where: {
			user: resolveUserId(user),
			status: { in: activeOrderStatus },
		},
	});

// Check if an order exists by ID
export const orderExists = async (id: string) =>
	(await db.orders.count({
		where: { id },
	})) > 0;

// Generate a unique order ID
const orderIdChars = "abcdefghijklmnopqrstuvwxyz1234567890".split("");
export const generateOrderId = async () => {
	for (let i = 0; i < 1000; i++) {
		const generated = [...Array(7)].map(() => orderIdChars[Math.floor(Math.random() * orderIdChars.length)]).join("");
		if (!(await orderExists(generated))) return generated;
	}
	throw new Error("This error should never appear. If it does, please buy a lottery ticket.");
};

// Get all active orders
export const getAllActiveOrders = async () =>
	db.orders.findMany({
		where: { status: { in: activeOrderStatus } },
	});

// Get an order by ID
export const getOrder = async (id: string) =>
	db.orders.findFirst({ where: { id } });

// Match an order status based on ID
export const matchOrderStatus = async (id: string, status: OrderStatus) =>
	db.orders.findFirst({ where: { id: { startsWith: id }, status } });

// Get the latest delivered order for a user
export const getLatestOrder = async (user: UserResolvable) =>
	db.orders.findFirst({
		where: {
			user: resolveUserId(user),
			status: OrderStatus.Delivered,
		},
		orderBy: { createdAt: "desc" },
	});

// Order flags for tracking feedback, tipping, and rating
export const OrderFlags = {
	FeedbackGiven: 0b1, // Binary flag for feedback give
	Rated: 0b100, // Binary flag for rating
};
