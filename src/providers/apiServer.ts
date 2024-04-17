// Import the framework and instantiate it
import Fastify from "fastify";
import {db} from "../database/database";

const fastify = Fastify();

// Declare a route
fastify.get("/", async function handler(request, reply) {
	return {hello: "world"};
});

fastify.get("/getOrders", async (req, res) => {
	return db.orders.findMany();
});

// Run the server!
try {
	fastify.listen({port: 3000}).then(r => {
		console.log("Server is running on port 3000");
	});
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}

export default fastify;