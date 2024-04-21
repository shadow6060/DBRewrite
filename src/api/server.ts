import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {db} from "../database/database";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"]
	}
});

app.get("/orders", async (req, res) => {
	return db.orders.findMany();
})

io.on("connection", (socket) => {
	console.log("someone's here...")
	socket.emit("ping");
});

httpServer.listen(3001, () => {
	console.log("Server is running on port 3001");
});