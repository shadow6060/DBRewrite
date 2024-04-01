import { development } from "./../../providers/env";
import { execSync } from "child_process";
import { format } from "../../utils/string";
import { transpile } from "typescript";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { client } from "../../providers/client";
import { channel } from "diagnostics_channel";
export const command = new Command("policy", "Gives you a link to our policy.")
	.setExecutor(async int => {
		int.channel.send("https://drunk-bartender.org/Policy");
	});