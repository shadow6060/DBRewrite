import { Snowflake } from "discord.js";
import { LifetimeMap } from "../../structures/LifetimeMap";
import { ExtendedCommand } from "../../structures/extendedCommand";
import { config } from "../../providers/config";

export const pinMap = new LifetimeMap<Snowflake, string>(15 * 60 * 1000);

export const command = new ExtendedCommand({
	name: "login",
	description: "Generates a pin required to login to the DB dashboard.",
})
	.addOption("boolean", (o) =>
		o
			.setName("refresh")
			.setDescription("Generate a new pin.")
			.setRequired(false)
	)
	.setExecutor(async (int) => {
		if (pinMap.has(int.user.id) && !int.options.getBoolean("refresh")) {
			await int.reply({
				ephemeral: true,
				content:
					"A pin's already been generated. If you've lost it, include the refresh option. Otherwise, wait for the current pin to expire.",
			});
		} // generate a random 6-character pin
		else {
			let pin = Math.random().toString(36).substring(2, 8);
			// unlikely, but check for collisions
			// convert iterator to array to check for collisions
			const pins = [...pinMap.values()];
			while (pins.includes(pin))
				pin = Math.random().toString(36).substring(2, 8);
			pinMap.set(int.user.id, pin);
			await int.reply({
				ephemeral: true,
				content: `Your pin was generated successfully! Head to ${config.dashboardUrl}/login and enter the following pin: \`${pin}\`. It will expire in 15 minutes.`,
			});
		}
	});
