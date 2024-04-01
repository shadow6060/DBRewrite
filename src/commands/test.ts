import { Command } from "../structures/Command";
import { actionRowOf, cbButton, cbSelectMenu } from "../utils/components";

export const command = new Command("test", "foo bar baz").setExecutor(async int => {
	await int.reply({
		components: [
			actionRowOf(
				cbButton(ctx => {
					ctx.disable();
				})
					.setLabel("Testing BUtton")
					.setEmoji("📈")
					.setStyle("DANGER")
			),
			actionRowOf(
				cbSelectMenu(async ctx => {
					await ctx.disable();
					await ctx.int.followUp(ctx.int.values.join(", "));
				})
					.setMaxValues(2)
					.setMinValues(1)
					.setPlaceholder("i am in severe pain")
					.setOptions(
						...[...Array(10)].map((_, x) => ({
							label: `label ${x}`,
							value: `${x}`,
							description: `description ${x}`,
							emoji: ["🕗", "♍", "🌎", "😑", "🔸", "💞", "🍤", "⛔", "🍊", "⏳"][x],
						}))
					)
			),
		],
	});
});
