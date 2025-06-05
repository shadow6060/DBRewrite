import { Command } from "../../structures/Command";
import {
	ChannelType,
	EmbedBuilder,
	GuildMember,
	MessageFlags,
	PermissionFlagsBits
} from "discord.js";
import { getserverConfig, upsertserverConfig } from "../../database/serverConfig";
import { hasGuildPermission } from "../../providers/MysticPro/hasGuildPermission";
import { config as botConfig } from "../../providers/config";

export const command = new Command("config", "Configure server settings")
	.addSubCommand(sub =>
		sub.setName("notificationchannel")
			.setDescription("Set the notification channel for XP and other events")
			.addChannelOption(opt =>
				opt.setName("channel")
					.setDescription("Channel for notifications")
					.addChannelTypes(ChannelType.GuildText)
					.setRequired(true)
			)
	)
	.addSubCommand(sub =>
		sub.setName("welcomechannel")
			.setDescription("Set the welcome channel")
			.addChannelOption(opt =>
				opt.setName("channel")
					.setDescription("Channel for welcomes")
					.addChannelTypes(ChannelType.GuildText)
					.setRequired(true)
			)
	)
	.addSubCommand(sub =>
		sub.setName("xpenabled")
			.setDescription("Enable or disable XP globally")
			.addBooleanOption(opt =>
				opt.setName("enabled")
					.setDescription("Enable XP globally?")
					.setRequired(true)
			)
	)
	.addSubCommand(sub =>
		sub.setName("xpchanneladd")
			.setDescription("Add a specific channel to receive XP")
			.addChannelOption(opt =>
				opt.setName("channel")
					.setDescription("Channel to enable XP in")
					.addChannelTypes(ChannelType.GuildText)
					.setRequired(true)
			)
	)
	.addSubCommand(sub =>
		sub.setName("xpchannelremove")
			.setDescription("Remove a channel from XP tracking")
			.addChannelOption(opt =>
				opt.setName("channel")
					.setDescription("Channel to disable XP in")
					.addChannelTypes(ChannelType.GuildText)
					.setRequired(true)
			)
	)
	.addSubCommand(sub =>
		sub.setName("setadminrole")
			.setDescription("Set a role to use admin-only config commands")
			.addRoleOption(opt =>
				opt.setName("role")
					.setDescription("Admin role")
					.setRequired(true)
			)
	)
	.addSubCommand(sub =>
		sub.setName("view")
			.setDescription("View current XP and config settings")
	)
	.addSubCommand(sub =>
		sub.setName("help")
			.setDescription("Show help for the config command")
	)
	.addPermissionNew("admin")
	.setExecutor(async (int) => {
		const guildId = int.guild?.id;
		if (!guildId) return;

		const sub = int.options.getSubcommand(true);
		const member = int.member as GuildMember;

		// Admin permission check including bot developers (owners)
		if (!["view", "help"].includes(sub)) {
			const isDeveloper = botConfig.developers.includes(member.id);
			const isAdmin = await hasGuildPermission(member, "admin");

			if (!isAdmin && !isDeveloper) {
				await int.reply({
					content: "❌ You do not have permission to use this command.",
					flags: MessageFlags.Ephemeral
				});
				return;
			}
		}

		if (sub === "notificationchannel") {
			const channel = int.options.getChannel("channel", true);
			await upsertserverConfig(guildId, { notificationChannel: channel.id });
			await int.reply(`🔔 Notification channel set to <#${channel.id}>.`);
		} else if (sub === "welcomechannel") {
			const channel = int.options.getChannel("channel", true);
			await upsertserverConfig(guildId, { welcomeChannel: channel.id });
			await int.reply(`👋 Welcome channel set to <#${channel.id}>.`);
		} else if (sub === "xpenabled") {
			const enabled = int.options.getBoolean("enabled", true);
			await upsertserverConfig(guildId, { xpEnabled: enabled });
			await int.reply(`📶 XP globally has been **${enabled ? "enabled" : "disabled"}**.`);
		} else if (sub === "xpchanneladd") {
			const channel = int.options.getChannel("channel", true);
			const config = await getserverConfig(guildId);
			const updated = Array.from(new Set([...(config?.xpEnabledChannels ?? []), channel.id]));
			await upsertserverConfig(guildId, { xpEnabledChannels: updated });
			await int.reply(`✅ XP enabled in <#${channel.id}>.`);
		} else if (sub === "xpchannelremove") {
			const channel = int.options.getChannel("channel", true);
			const config = await getserverConfig(guildId);
			const updated = (config?.xpEnabledChannels ?? []).filter(id => id !== channel.id);
			await upsertserverConfig(guildId, { xpEnabledChannels: updated });
			await int.reply(`🚫 XP disabled in <#${channel.id}>.`);
		} else if (sub === "setadminrole") {
			const role = int.options.getRole("role", true);
			await upsertserverConfig(guildId, { adminRoles: [role.id] });
			await int.reply(`🔐 Admin role set to <@&${role.id}>.`);
		} else if (sub === "view") {
			const config = await getserverConfig(guildId);

			// Check if user has administrator permission or admin role
			const hasAdminRole = config?.adminRoles?.some(roleId => member.roles.cache.has(roleId));
			const isAdministrator = member.permissions.has(PermissionFlagsBits.Administrator);

			if (!hasAdminRole && !isAdministrator) {
				await int.reply({
					content: "❌ You must be an administrator or have the configured admin role to view the server configuration.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const embed = new EmbedBuilder()
				.setTitle("📊 Server Configuration")
				.setColor("#00AAFF")
				.addFields(
					{ name: "🔔 Notification Channel", value: config?.notificationChannel ? `<#${config.notificationChannel}>` : "Not Set", inline: true },
					{ name: "👋 Welcome Channel", value: config?.welcomeChannel ? `<#${config.welcomeChannel}>` : "Not Set", inline: true },
					{ name: "🌐 XP Global", value: `${config?.xpEnabled ? "Enabled" : "Disabled"}`, inline: true },
					{
						name: "📍 XP Channels",
						value: config?.xpEnabledChannels?.length
							? config.xpEnabledChannels.map(id => `<#${id}>`).join(", ")
							: "All Channels Enabled (Global XP)",
						inline: false
					},
					{
						name: "XP Settings Explained",
						value: "If XP is enabled and no specific channels are set, all channels will gain XP. Otherwise, only the selected channels will.",
						inline: false
					},
					{
						name: "🛠 Admin Role",
						value: config?.adminRoles?.[0] ? `<@&${config.adminRoles[0]}>` : "Not Set",
						inline: true
					}
				)
				.setFooter({ text: "Use /config <subcommand> to update settings." })
				.setTimestamp();

			await int.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} else if (sub === "help") {
			const embed = new EmbedBuilder()
				.setTitle("🛠 Config Command Help")
				.setColor("#0099ff")
				.setDescription("Manage server configuration settings. Subcommands:")
				.addFields(
					{ name: "/config notificationchannel <channel>", value: "Set the notification channel for XP and other events." },
					{ name: "/config welcomechannel <channel>", value: "Set the welcome channel." },
					{ name: "/config xpenabled <true|false>", value: "Enable or disable XP globally." },
					{ name: "/config xpchanneladd <channel>", value: "Add a channel to XP tracking." },
					{ name: "/config xpchannelremove <channel>", value: "Remove a channel from XP tracking." },
					{ name: "/config setadminrole <role>", value: "Set a role for admin-only config access." },
					{ name: "/config view", value: "View the current server configuration." },
					{ name: "/config help", value: "Show this help message." }
				)
				.setFooter({ text: "Only admins can change config settings." })
				.setTimestamp();

			await int.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		return;
	});
