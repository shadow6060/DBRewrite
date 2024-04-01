/* eslint-disable quotes */
/* eslint-disable indent */
import got from "got";
import { EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";

export const command = new Command("memes", "memes!")
  .setExecutor(async int => {
    got('https://www.reddit.com/r/memes/random/.json')
      .then((response: { body: string; }) => {
        const [list] = JSON.parse(response.body);
        const [post] = list.data.children;

        const permalink = post.data.permalink;
        const memeUrl = `https://reddit.com${permalink}`;
        const memeImage = post.data.url;
        const memeTitle = post.data.title;
        const memeUpvotes = post.data.ups;
        const memeNumComments = post.data.num_comments;

        int.reply({
          embeds: [
            new EmbedBuilder()
              .setImage(memeImage)
              .setDescription(`${int.user.tag} Has summoned a meme!`)
              .setFooter({ text: `${memeUrl} | Upvotes: ${memeUpvotes}` }),
          ],
        });
      });
  });
