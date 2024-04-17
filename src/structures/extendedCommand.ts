/* eslint-disable indent */
import {Command} from "./Command";

// Define the interface for command options
interface CommandOptions {
    name: string;
    description?: string;
    local?: boolean;
    // New property to specify whether the command should be registered locally
    // Other properties as needed
}

// Define the ExtendedCommand class
export class ExtendedCommand extends Command {
    // Add new properties specific to your modifications
    global: boolean;
    local: boolean; // New property to specify whether the command should be registered locally

    // Constructor
    constructor({ name, description, local = false, ...options }: CommandOptions) {
        super(name, description);
        this.global = !local; // Set global property based on the value of local
        this.local = local;
    }
}