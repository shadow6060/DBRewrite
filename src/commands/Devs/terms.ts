import { development } from "./../../providers/env";
import { execSync } from "child_process";
import { format } from "../../utils/string";
import { transpile } from "typescript";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { client } from "../../providers/client";
import { channel } from "diagnostics_channel";
export const command = new Command("tos", "Gives you a link to our tos.")
	.setExecutor(async int => {
		int.channel.send("https://drunk-bartender.org/Terms_of_Service");
	});