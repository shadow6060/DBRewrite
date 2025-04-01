import "./providers/client";
import { client } from "./providers/client";
import { development, production } from "./providers/env";
import "source-map-support/register";
// import "./providers/apiServer";

import { messageCreateHandler } from "./events/MessageCreate";

client.on("messageCreate", messageCreateHandler);


if (development) console.warn("Starting in development mode!");
if (production) console.warn("Starting in production mode!");
