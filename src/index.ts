import "./providers/client";
import {development, production} from "./providers/env";
import "source-map-support/register";
// experimental API
import "./api/server";

if (development) console.warn("Starting in development mode!");
if (production) console.warn("Starting in production mode!");

