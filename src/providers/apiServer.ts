/* eslint-disable linebreak-style */
/* eslint-disable quotes */
// Import the framework and instantiate it
import Fastify from "fastify";

const fastify = Fastify({
	logger: true
});

// Declare a route
fastify.get("/", async function handler(request, reply) {
	return { hello: "world" };
});

// Run the server!
try {
	fastify.listen({ port: 3000 }).then(() => {
		console.log(`Server listening on port 3000.`);
	});
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}

export default fastify;