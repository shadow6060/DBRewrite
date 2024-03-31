import {db} from "../../database/database";
import {text} from "../../providers/config";
import {permissions} from "../../providers/permissions";
import {Command} from "../../structures/Command";
import {blacklist, createBlacklist} from "../../database/blacklist";

export const command = new Command("blacklist", "Blacklists a user, server, or channel.")
	.addPermission(permissions.moderator)
	.addOption("string", o => o.setName("id").setDescription("The ID of the user, server, or channel.").setRequired(true))
	.addOption("string", o => o.setName("reason").setDescription("The reason for the blacklist."))
	.addOption("boolean", o => o.setName("unblacklist").setDescription("Whether to unblacklist instead of blacklisting."))
	.setExecutor(async int => {
		const id = int.options.get("id", true).value as string;
		if (int.options.get("unblacklist", true).value as boolean) {
			if (!blacklist.has(id)) {
				await int.reply(text.commands.blacklist.remove.existing);
				return;
			}
			blacklist.delete(id);
			await db.blacklist.delete({where: {id}});
			await int.reply(text.commands.blacklist.remove.success);
		} else {
			if (blacklist.has(id)) {
				await int.reply(text.commands.blacklist.existing);
				return;
			}
			await createBlacklist(id, int.user, int.options.get("reason", true).value as string ?? "No reason specified.");
			await int.reply(text.commands.blacklist.success);
		}
	});
