import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { db } from "../database/database";
import { pinMap } from "../commands/dashboard/auth";
import { z } from "zod";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

app.get("/orders", async (req, res) => {
	return db.orders.findMany();
});

// 7 days expiry
const expiryTime = 7 * 24 * 60 * 60 * 1000;

export type LoginRequest = {
	pin: string;
	userID: string;
	state: string;
	purge?: boolean;
};

app.get("/login", async (req, res) => {
	// 0-9a-z
	const pin = z
		.string()
		.length(6)
		.regex(/^[0-9a-z]*$/)
		.safeParse(req.query.pin);
	if (!pin.success) {
		return res.status(400).send("Invalid pin");
	}

	const userID = z
		.string()
		.min(17)
		.max(18)
		.regex(/^\d+$/)
		.safeParse(req.query.userID);
	if (!userID.success) {
		return res.status(400).send("Invalid user ID");
	}

	// does this user exist in the UserInfo table?
	const user = await db.userInfo.findUnique({
		where: {
			id: userID.data,
		},
	});

	if (!user) {
		return res.status(404).send("User not found");
	}

	// is this pin valid?
	const pins = [...pinMap.values()];
	if (!pins.includes(pin.data)) {
		return res.status(403).send("Pin not found");
	}

	// KILL the pin
	pinMap.delete(userID.data);

	// do you already have a token? if so return it
	const existingToken = await db.authUser.findFirst({
		where: {
			userID: userID.data,
		},
	});

	// blank values are falsy
	const purge = req.query.purge === "" || req.query.purge;
	if (existingToken && purge) {
		await db.authUser.delete({
			where: {
				userID: userID.data,
			},
		});
	} else if (existingToken) {
		// not modified 304
		return res.status(304).send({
			token: existingToken.token,
			expiry: existingToken.expiry,
			state: req.query.state, // for CSRF protection
		});
	}

	// great, the pin and user are valid! create a new AuthUser
	// exactly 32 characters, 0-9a-z, expires in 7 days.
	const token = new Array(32)
		.fill(0)
		.map(() => Math.random().toString(36)[2])
		.join("");

	const authUser = await db.authUser.create({
		data: {
			token: token,
			expiry: new Date(Date.now() + expiryTime),
			userID: userID.data,
		},
	});

	res.status(200).send({
		token: authUser.token,
		expiry: authUser.expiry,
		state: req.query.state, // for CSRF protection
	});
});

io.on("connection", (socket) => {
	console.log("someone's here...");
	socket.emit("ping");
});

httpServer.listen(3001, () => {
	console.log("Server is running on port 3001");
});