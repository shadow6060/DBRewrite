/* eslint-disable indent */
import { Command } from "./Command";
import { config } from "../providers/config";

// Define the interface for command options
interface CommandOptions {
    name: string;
    description?: string;
    local?: boolean;
    servers?: string[]; // New property to specify servers where the command should be registered locally
    // Other properties as needed
}

// Define the ExtendedCommand class
export class ExtendedCommand extends Command {
    // Add new properties specific to your modifications
    global: boolean;
    local: boolean; // New property to specify whether the command should be registered locally
    servers: string[] | undefined; // New property to specify servers where the command should be registered locally

    // Constructor
    constructor({ name, description, local = false, servers, ...options }: CommandOptions) {
        super(name, description, options);
        this.global = !local; // Set global property based on the value of local
        this.local = local;

        // Ensure servers is an array and set it to the provided value, or set it as undefined if not provided
        this.servers = Array.isArray(servers) ? servers : undefined;
    }
}
