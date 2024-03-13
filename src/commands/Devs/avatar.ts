import { ExtendedCommand } from "./../../structures/extendedCommand";
/* eslint-disable quotes */
/* eslint-disable indent */
import { client } from "../../providers/client";
import { permissions } from "../../providers/permissions";
import { Command } from "../../structures/Command";
import { CommandInteraction, EmbedBuilder } from "discord.js";

export const command = new ExtendedCommand({ name: "avatar", description: "Some info." })
    .addPermission(permissions.developer) // AnyRank
    .addSubCommand((subcommand) =>
        subcommand
            .setName("attach")
            .setDescription("Attach an image to update the bot's avatar.")
            .addAttachmentOption((option) =>
                option
                    .setName("attachment")
                    .setDescription("The image to attach for updating the avatar.")
                    .setRequired(true)
            )
    )
    .setExecutor(async (int: CommandInteraction) => {
        // Check the subcommand
        const subcommand = int.options.getSubcommand(true);

        if (subcommand === "attach") {
            // Defer the reply to avoid potential issues with the interaction being deleted
            await int.deferReply({ ephemeral: true });

            // Fetch the attachment from the options
            const attachment = int.options.get("attachment", true)?.attachment;

            if (!attachment) {
                await int.editReply({ content: "Attachment is missing or not valid." });
                return;
            }

            try {
                // Read the attachment and set it as the bot's avatar
                const avatarBuffer = await fetch(attachment.url).then((res) => res.arrayBuffer());
                const buffer = Buffer.from(avatarBuffer); // Convert ArrayBuffer to Buffer
                await client.user?.setAvatar(buffer);

                // Example: Respond with success message
                const embed = new EmbedBuilder()
                    .setTitle('Bot Avatar Updated')
                    .setDescription('Bot avatar updated successfully!')
                    .setColor('#00ff00') // You can customize the color
                    .setAuthor({ name: int.user.username, iconURL: int.user.displayAvatarURL() })
                    .setFooter({ text: 'Update Avatar Command', iconURL: client.user?.displayAvatarURL() });

                // Reply with the success message and the image embed
                await int.editReply({ embeds: [embed] });

                // Extra logging: Print the bot's current avatar URL after the update
                console.log("Bot's current avatar URL:", client.user?.displayAvatarURL());
            } catch (error) {
                // Cast error to Error type
                const errorObject = error as Error;

                // Example: Respond with error message
                console.error('Failed to update avatar:', errorObject);

                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error Updating Avatar')
                    .setDescription(`Failed to update bot avatar: ${errorObject.message}`)
                    .setColor('#ff0000') // You can customize the color
                    .setAuthor({ name: int.user.username, iconURL: int.user.displayAvatarURL() })
                    .setFooter({ text: 'Update Avatar Command', iconURL: client.user?.displayAvatarURL() });

                // Reply with the error message
                await int.editReply({ embeds: [errorEmbed] });
            }
        } else {
            // Handle other subcommands or the default behavior here
        }
    });
